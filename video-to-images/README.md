# 🎥 YouTube & Video Practice Question Extractor

An automated Python utility designed to extract practice questions from YouTube videos or local video files. It detects unique question frames, eliminates duplicate frames using visual or text-based comparison algorithms, performs OCR, and exports results into custom formats (Text, PDF, and Image Frames).

---

## ✨ Features

* **Dual Input Support:** Pass a direct YouTube video URL or a local video file path (`.mp4`, `.mkv`, `.avi`, etc.).
* **Smart Deduplication:** 
  * **Visual Frame Comparison (Fast):** Compares pixel difference across frames using OpenCV to skip redundant OCR processing.
  * **Text Similarity Comparison (Accurate):** Uses EasyOCR combined with TF-IDF cosine text similarity to detect duplicate text across moving/animated backgrounds.
* **Flexible Export Options:**
  * Clean Text File (`.txt`) with question index and timestamps.
  * Compiled PDF document (`.pdf`) containing full slide screenshots.
  * Individual image frames folder (`.jpg`).
* **Custom Output Directory:** Specify any local export directory for generated outputs.

---

## 🛠️ Installation

### 1. Prerequisites
Ensure you have **Python 3.8+** installed on your system.

### 2. Install Required Dependencies

Install the required Python packages using `pip`:

```bash
pip install opencv-python easyocr scikit-learn yt-dlp img2pdf
```

Note for CPU Users: EasyOCR uses PyTorch. If you do not have an NVIDIA CUDA-capable GPU, the script defaults to CPU mode smoothly without cluttering warning outputs.

## 🚀 How to Run
- Clone or download this repository to your local machine.
- Open a terminal / command prompt in the script directory.
- Run the Python script:

```bash
python question_extractor.py
```

## 📋 Interactive Prompts
When you launch the script, it guides you through 4 steps:

### 1. Video Input
- YouTube URL: https://www.youtube.com/watch?v=...
- Local File Path: C:/videos/practice_questions.mp4

### 2. Export Folder Directory
- Specify a path like D:/StudyMaterial/PythonQuestions or press Enter to save to default (./output).

### 3. Comparison Algorithm Mode
- [1] Visual Frame Comparison (Recommended): Fast. Checks pixel differences between frames and triggers OCR only when the slide changes.
- [2] Text Similarity Comparison: Detailed. Uses EasyOCR on every sampled frame and calculates text similarity to ignore minor screen animations (timers, webcam overlays).

### 4. Output Export Format
- [1] Text File (.txt)
- [2] PDF Document (.pdf)
- [3] Text File + PDF Document (.txt & .pdf)
- [4] Image Frames Folder (.jpg)
- [5] Everything (.txt, .pdf, and .jpg image folder)

## 📁 Output Structure Example
If you choose Option 5 (Everything) with export folder D:/StudyOutput:

```Plaintext
D:/StudyOutput/
├── extracted_questions.txt
├── extracted_questions.pdf
└── question_frames/
    ├── question_001_00m12s.jpg
    ├── question_002_00m45s.jpg
    └── question_003_01m20s.jpg
```

## ⚙️ Advanced Settings (Optional Configuration)
- You can tweak parameters directly inside extract_questions() in the script:
- Sampling Rate (sample_interval_sec): Default is set to 2 seconds. Increase for longer videos to speed up processing.
- Text Similarity Threshold: Default is set to 0.75 (75%). Lower this value if questions are very similar to each other.
- Visual Frame Difference Threshold: Default is set to 5.0%. Increase if video background has minor animated particles or small timer badges.

## 📜 License
-  This utility is distributed under the MIT License. Feel free to modify and adapt it to your needs!