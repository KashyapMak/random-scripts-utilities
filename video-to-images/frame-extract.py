##pip install opencv-python easyocr scikit-learn yt-dlp img2pdf

import os
import shutil
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

import cv2
import easyocr
import yt_dlp
import numpy as np
import img2pdf
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Initialize EasyOCR reader
reader = easyocr.Reader(['en'], gpu=False)

def resolve_video_input(source):
    """Handles YouTube URL downloading or local file path verification."""
    if source.startswith("http://") or source.startswith("https://"):
        print("\n[+] Downloading video from YouTube...")
        output_file = "downloaded_youtube_video.mp4"
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': output_file,
            'quiet': True,
            'overwrites': True
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([source])
        print("[+] Download complete!\n")
        return output_file
    else:
        source = source.strip("'\"")
        if not os.path.exists(source):
            raise FileNotFoundError(f"Local file not found: {source}")
        return source


def extract_frames(video_source, output_dir="extracted_output", mode="1", export_choice="5", sample_interval_sec=10):
    # Ensure the main export folder exists
    output_dir = output_dir.strip("'\"")
    os.makedirs(output_dir, exist_ok=True)
    
    video_path = resolve_video_input(video_source)
    
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_step = int(fps * sample_interval_sec)
    
    unique_frames = []
    last_saved_gray_frame = None
    frame_count = 0

    # Subfolder for individual image frames
    frames_dir = os.path.join(output_dir, "frame_frames")
    if export_choice in ["2", "3", "4", "5"]:
        os.makedirs(frames_dir, exist_ok=True)

    print("[+] Processing video... Please wait.\n")

    while cap.isOpened():
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_count)
        ret, frame = cap.read()
        if not ret:
            break

        timestamp_sec = int(frame_count / fps)
        minutes, seconds = divmod(timestamp_sec, 60)
        time_str = f"{minutes:02d}:{seconds:02d}"
        
        is_new_frame = False
        extracted_text = ""

        # --- MODE 1: VISUAL FRAME COMPARISON (FAST) ---
        if mode == "1":
            gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray_frame = cv2.GaussianBlur(gray_frame, (21, 21), 0)

            is_visually_different = True
            if last_saved_gray_frame is not None:
                diff = cv2.absdiff(last_saved_gray_frame, gray_frame)
                percentage_diff = (np.count_nonzero(diff > 25) / diff.size) * 100
                
                if percentage_diff < 5.0:
                    is_visually_different = False

            if is_visually_different:
                ocr_results = reader.readtext(frame, detail=0)
                extracted_text = " ".join(ocr_results).strip()

                if len(extracted_text) > 15:
                    last_saved_gray_frame = gray_frame
                    is_new_frame = True

        # --- MODE 2: TEXT-BASED OCR COMPARISON (ACCURATE) ---
        elif mode == "2":
            ocr_results = reader.readtext(frame, detail=0)
            extracted_text = " ".join(ocr_results).strip()

            if len(extracted_text) > 15:
                is_duplicate = False
                if unique_frames:
                    last_text = unique_frames[-1]["text"]
                    vectorizer = TfidfVectorizer().fit_transform([last_text, extracted_text])
                    vectors = vectorizer.toarray()
                    sim_score = cosine_similarity([vectors[0]], [vectors[1]])[0][0]

                    if sim_score >= 0.75:
                        is_duplicate = True

                if not is_duplicate:
                    is_new_frame = True

        # --- PROCESS CAPTURED frame ---
        if is_new_frame:
            q_num = len(unique_frames) + 1
            img_path = None

            # Save frame image inside the chosen export directory
            if export_choice in ["2", "3", "4", "5"]:
                img_path = os.path.join(frames_dir, f"frame_{q_num:03d}_{time_str.replace(':', 'm')}s.jpg")
                cv2.imwrite(img_path, frame)

            unique_frames.append({
                "num": q_num,
                "time": time_str,
                "text": extracted_text,
                "img_path": img_path
            })

            print(f"[Captured] frame {q_num} at timestamp {time_str}")

        frame_count += frame_step

    cap.release()
    print(f"\n[+] Processing complete! Found {len(unique_frames)} unique frames.")

    # --- EXPORT 1: TEXT FILE ---
    if export_choice in ["1", "3", "5"] and unique_frames:
        txt_path = os.path.join(output_dir, "extracted_frames.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write("==================================================\n")
            f.write("           EXTRACTED PRACTICE frameS          \n")
            f.write("==================================================\n\n")
            for q in unique_frames:
                f.write(f"\n--- frame {q['num']} [Timestamp: {q['time']}] ---\n")
                f.write(f"{q['text']}\n")
        print(f"[✔] Text file saved: '{txt_path}'")

    # --- EXPORT 2: PDF FILE ---
    if export_choice in ["2", "3", "5"] and unique_frames:
        pdf_path = os.path.join(output_dir, "extracted_frames.pdf")
        image_files = [q["img_path"] for q in unique_frames if q["img_path"] and os.path.exists(q["img_path"])]

        if image_files:
            with open(pdf_path, "wb") as f:
                f.write(img2pdf.convert(image_files))
            print(f"[✔] PDF document saved: '{pdf_path}'")

    # --- EXPORT 3: IMAGE FOLDER CLEANUP / PRESERVATION ---
    if export_choice in ["1", "2", "3"] and os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    elif export_choice in ["4", "5"] and unique_frames:
        print(f"[✔] Image frames saved in folder: '{frames_dir}'")

    print(f"\nAll requested outputs have been saved to: '{os.path.abspath(output_dir)}'")


if __name__ == "__main__":
    print("=" * 55)
    print("    YOUTUBE / VIDEO PRACTICE FRAME EXTRACTOR    ")
    print("=" * 55)

    source_input = input("\n1. Enter YouTube URL or Local File Path: ").strip()

    export_folder = input("2. Enter Export Directory Path (Press Enter for default './output'): ").strip()
    if not export_folder:
        export_folder = "output"

    print("\n3. Select Comparison Mode:")
    print("   [1] Visual Frame Comparison (Fastest - recommended for static slides)")
    print("   [2] Text Similarity Comparison (Accurate - recommended for animated backgrounds)")
    mode_choice = input("   Choice (1 or 2, default 1): ").strip() or "1"

    print("\n4. Select Export Format:")
    print("   [1] Text File (.txt)")
    print("   [2] PDF Document (.pdf)")
    print("   [3] Text File + PDF Document (.txt & .pdf)")
    print("   [4] Image Frames Folder (.jpg images)")
    print("   [5] Everything (Text File + PDF + Image Folder)")
    export_choice = input("   Choice (1-5, default 5): ").strip() or "5"

    extract_frames(source_input, output_dir=export_folder, mode=mode_choice, export_choice=export_choice)
