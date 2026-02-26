// data for each system portal
const systems = [
    {
        title: 'Gestão de projetos',
        url: 'https://secti.netlify.app',
        domain: 'secti.netlify.app',
        desc: 'Módulo de gestão de projetos'
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
    
    // MOBILE-FIRST UPDATES APPLIED BELOW
    template.innerHTML = `
    <article class="flex flex-col w-full">
        <div class="safari-window w-full rounded-lg overflow-hidden shadow-md">
            <div class="safari-toolbar bg-slate-200 px-3 py-2 flex items-center text-xs sm:text-sm">
                <div class="safari-dots flex space-x-1.5 mr-4">
                    <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400"></div>
                    <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400"></div>
                    <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
                </div>
                <div class="safari-address-bar bg-white px-2 py-1 rounded-md flex-1 text-center text-slate-600 truncate">
                    <i class="fas fa-lock text-slate-400 mr-1"></i> ${domain}
                </div>
            </div>
            <div class="iframe-wrapper relative w-full aspect-video sm:aspect-[4/3] md:aspect-video bg-slate-50">
                <div class="iframe-overlay absolute inset-0 z-10"></div>
                <div class="iframe-container h-full w-full">
                    <iframe class="w-full h-full border-none" src="${url}" title="Preview ${title}"></iframe>
                </div>
            </div>
        </div>
        
        <div class="mt-4 md:mt-6 flex flex-col sm:flex-row sm:justify-between items-center px-2 gap-4 sm:gap-0">
            <div class="text-center sm:text-left">
                <h3 class="font-bold text-slate-800 text-base md:text-lg">${title}</h3>
                <p class="text-xs md:text-sm text-slate-500">${desc}</p>
            </div>
            <a href="${url}" target="_blank" 
               class="btn-access w-full sm:w-auto text-center text-white text-xs font-bold px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg shadow-blue-200 uppercase tracking-wider transition-transform hover:scale-105">
                Abrir Sistema
            </a>
        </div>
    </article>`;
    return template.content.cloneNode(true);
}

async function init() {
    await Promise.all([
        loadComponent('main-header', 'components/header.html'),
        loadComponent('main-footer', 'components/footer.html')
    ]);

    const grid = document.getElementById('systems-grid');
    systems.forEach(sys => grid.appendChild(createSafariWindow(sys)));
}

document.addEventListener('DOMContentLoaded', init);