// data for each system portal
const systems = [
    {
        title: 'Portal Institucional',
        url: 'https://secti.netlify.app',
        domain: 'secti.netlify.app',
        desc: 'Página de entrada da secretaria'
    },
    {
        title: 'Gestão de Contratos',
        url: 'https://secti-contratos.netlify.app/',
        domain: 'secti-contratos.netlify.app',
        desc: 'Módulo de administração contratual'
    }
];

async function loadComponent(id, path) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`failed to load ${path}`);
        document.getElementById(id).innerHTML = await res.text();
    } catch (e) {
        console.error(e);
    }
}

function createSafariWindow({ title, url, domain, desc }) {
    const template = document.createElement('template');
    template.innerHTML = `
    <article class="flex flex-col">
        <div class="safari-window">
            <div class="safari-toolbar">
                <div class="safari-dots">
                    <div class="dot dot-red"></div>
                    <div class="dot dot-yellow"></div>
                    <div class="dot dot-green"></div>
                </div>
                <div class="safari-address-bar">
                    <i class="fas fa-lock"></i> ${domain}
                </div>
            </div>
            <div class="iframe-wrapper">
                <div class="iframe-overlay"></div>
                <div class="iframe-container h-full">
                    <iframe src="${url}" title="Preview ${title}"></iframe>
                </div>
            </div>
        </div>
        <div class="mt-6 flex justify-between items-center px-2">
            <div>
                <h3 class="font-bold text-slate-800">${title}</h3>
                <p class="text-xs text-slate-500">${desc}</p>
            </div>
            <a href="${url}" target="_blank" 
               class="btn-access text-white text-xs font-bold px-6 py-3 rounded-full shadow-lg shadow-blue-200 uppercase tracking-wider">
                Abrir Sistema
            </a>
        </div>
    </article>`;
    return template.content.cloneNode(true);
}

async function init() {
    // load header/footer html
    await Promise.all([
        loadComponent('main-header', 'components/header.html'),
        loadComponent('main-footer', 'components/footer.html')
    ]);

    const grid = document.getElementById('systems-grid');
    systems.forEach(sys => grid.appendChild(createSafariWindow(sys)));
}

document.addEventListener('DOMContentLoaded', init);
