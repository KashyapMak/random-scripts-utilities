(function() {
    const scriptUrl = document.currentScript.src;
    const siteRoot = new URL('./', scriptUrl);
    const headerHeight = 56;

    window.tailwind = window.tailwind || {};
    window.tailwind.config = {
        prefix: 'hub-',
        corePlugins: { preflight: false }
    };

    const tailwindScript = document.createElement('script');
    tailwindScript.src = 'https://cdn.tailwindcss.com';
    document.head.append(tailwindScript);

    const style = document.createElement('style');
    style.textContent = `
        .utility-hub-header {
            position: fixed;
            z-index: 10000;
            inset: 0 0 auto;
            width: auto;
            height: ${headerHeight}px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 clamp(16px, 4vw, 40px);
            border-bottom: 1px solid #dce8df;
            background: rgba(255, 255, 255, .96);
            color: #17382d;
            font-family: "DM Sans", "Segoe UI", sans-serif;
            box-shadow: 0 2px 12px rgba(23, 56, 45, .06);
        }
        .utility-hub-brand {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            color: #17382d;
            font-family: "Space Grotesk", "Segoe UI", sans-serif;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
        }
        .utility-hub-mark {
            display: grid;
            width: 30px;
            height: 30px;
            place-items: center;
            border-radius: 7px;
            background: #d9ee91;
            color: #17382d;
            font-size: 11px;
        }
        .utility-hub-menu { position: relative; }
        .utility-hub-toggle {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            min-height: 36px;
            padding: 0 12px;
            border: 1px solid #dce8df;
            border-radius: 5px;
            background: #fff;
            color: #245b47;
            cursor: pointer;
            font-family: inherit;
            font-size: 13px;
            font-weight: 700;
        }
        .utility-hub-toggle::after { content: "⌄"; font-size: 16px; margin-top: -10px; }
        .utility-hub-toggle[aria-expanded="true"] { border-color: #9bc5aa; background: #f1f8f3; }
        .utility-hub-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            display: grid;
            gap: 3px;
            width: min(360px, calc(100vw - 24px));
            max-height: min(70vh, 520px);
            overflow-y: auto;
            padding: 7px;
            border: 1px solid #dce8df;
            border-radius: 7px;
            background: #fff;
            box-shadow: 0 14px 36px rgba(23, 56, 45, .16);
        }
        .utility-hub-dropdown[hidden] { display: none !important; }
        .utility-hub-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 11px;
            border-radius: 4px;
            color: #17382d;
            text-decoration: none;
        }
        .utility-hub-item:hover, .utility-hub-item:focus-visible { outline: none; background: #eef6ef; }
        .utility-hub-item-name { font-size: 13px; font-weight: 650; line-height: 1.35; }
        .utility-hub-item-category { flex: none; color: #65766c; font-family: "DM Mono", monospace; font-size: 9px; text-transform: uppercase; }
        .utility-hub-loading { padding: 12px; color: #65766c; font-size: 12px; }
        .utility-hub-header a:focus-visible, .utility-hub-toggle:focus-visible { outline: 3px solid #a8d0b3; outline-offset: 3px; }
        @media (max-width: 480px) {
            .utility-hub-header { padding: 0 12px; }
            .utility-hub-brand { gap: 7px; font-size: 14px; }
            .utility-hub-mark { width: 27px; height: 27px; }
            .utility-hub-toggle { padding: 0 9px; }
        }
    `;
    document.head.append(style);

    const bodyStyle = getComputedStyle(document.body);
    const bodyTop = parseFloat(bodyStyle.marginTop) || 0;
    const bodyPaddingTop = parseFloat(bodyStyle.paddingTop) || 0;
    const contentTop = bodyTop + bodyPaddingTop;
    if (contentTop < headerHeight) {
        document.body.style.paddingTop = `${bodyPaddingTop + headerHeight - contentTop}px`;
    }

    const header = document.createElement('header');
    header.className = 'utility-hub-header hub-fixed hub-inset-x-0 hub-top-0 hub-z-50 hub-flex hub-h-14 hub-items-center hub-justify-between hub-border-b hub-bg-white/95 hub-px-4 hub-shadow-sm';

    const brand = document.createElement('a');
    brand.className = 'utility-hub-brand hub-inline-flex hub-items-center hub-gap-2.5 hub-font-bold';
    brand.href = siteRoot.href;
    brand.setAttribute('aria-label', 'A Utility Hub home');

    const mark = document.createElement('span');
    mark.className = 'utility-hub-mark hub-grid hub-place-items-center';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = 'AU';

    const projectName = document.createElement('span');
    projectName.textContent = 'A Utility Hub';
    brand.append(mark, projectName);

    const menu = document.createElement('div');
    menu.className = 'utility-hub-menu hub-relative';
    const toggle = document.createElement('button');
    toggle.className = 'utility-hub-toggle hub-inline-flex hub-cursor-pointer hub-items-center hub-gap-2 hub-rounded hub-border hub-px-3 hub-py-2 hub-text-sm hub-font-semibold';
    toggle.type = 'button';
    toggle.textContent = 'Utilities';
    toggle.setAttribute('aria-expanded', 'false');
    const dropdown = document.createElement('div');
    dropdown.className = 'utility-hub-dropdown hub-absolute hub-right-0 hub-max-h-[70vh] hub-overflow-y-auto hub-rounded-lg hub-border hub-bg-white hub-p-2 hub-shadow-xl';
    dropdown.hidden = true;
    dropdown.setAttribute('aria-label', 'Available utilities');
    dropdown.append(Object.assign(document.createElement('div'), {
        className: 'utility-hub-loading',
        textContent: 'Loading utilities...'
    }));
    menu.append(toggle, dropdown);
    header.append(brand, menu);
    document.body.prepend(header);

    function closeMenu() {
        dropdown.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
        dropdown.hidden = !dropdown.hidden;
        toggle.setAttribute('aria-expanded', String(!dropdown.hidden));
    });
    document.addEventListener('click', event => {
        if (!menu.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !dropdown.hidden) {
            closeMenu();
            toggle.focus();
        }
    });

    fetch(new URL('utilities.json', siteRoot))
        .then(response => {
            if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
            return response.json();
        })
        .then(utilities => {
            dropdown.replaceChildren();
            utilities.forEach(utility => {
                const item = document.createElement('a');
                item.className = 'utility-hub-item hub-flex hub-items-center hub-justify-between hub-gap-3 hub-rounded hub-px-3 hub-py-2';
                item.href = new URL(utility.path, siteRoot).href;
                item.addEventListener('click', closeMenu);
                if (utility.type === 'external') {
                    item.target = '_blank';
                    item.rel = 'noopener noreferrer';
                }
                if (utility.type === 'download') item.download = '';

                const name = document.createElement('span');
                name.className = 'utility-hub-item-name hub-text-sm hub-font-medium';
                name.textContent = utility.name;
                const category = document.createElement('span');
                category.className = 'utility-hub-item-category hub-text-xs hub-uppercase';
                category.textContent = utility.category;
                item.append(name, category);
                dropdown.append(item);
            });
        })
        .catch(error => {
            dropdown.replaceChildren();
            const message = document.createElement('div');
            message.className = 'utility-hub-loading';
            message.textContent = 'Could not load utilities.';
            dropdown.append(message);
            console.error('Unable to load utility navigation:', error);
        });
})();