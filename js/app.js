// data for each system portal
const systems = [
    {
        title: 'Gestão de Projetos',
        url: 'https://secti.netlify.app',
        domain: 'secti.netlify.app',
        desc: 'Módulo de planejamento e acompanhamento de metas.'
    },
    {
        title: 'Gestão de Contratos',
        url: 'https://secti-contratos.netlify.app/',
        domain: 'secti-contratos.netlify.app',
        desc: 'Administração de documentos e vigências contratuais.'
    },
    {
        title: 'Painel Conecta Bahia',
        url: 'https://conectabahia.netlify.app/',
        domain: 'conectabahia.netlify.app',
        desc: 'Mapa interativo de praças com Wi-Fi gratuito no estado.'
    }
];

function createSafariWindow({ title, url, domain, desc }) {
    const template = document.createElement('template');

    // Design refinado com Glassmorphism e sombras suaves
    template.innerHTML = `
    <article class="group flex flex-col w-full transition-all duration-500 ease-out">
        <div class="safari-window w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-slate-200/60 bg-white transition-shadow duration-300">
            
            <div class="safari-toolbar bg-slate-50/70 backdrop-blur-xl px-4 py-3 flex items-center border-b border-slate-200/50">
                <div class="safari-dots flex space-x-2 mr-6">
                    <div class="dot w-3 h-3 rounded-full bg-rose-400/90 shadow-sm shadow-rose-200 transition-transform duration-300"></div>
                    <div class="dot w-3 h-3 rounded-full bg-amber-400/90 shadow-sm shadow-amber-200 transition-transform duration-300"></div>
                    <div class="dot w-3 h-3 rounded-full bg-emerald-400/90 shadow-sm shadow-emerald-200 transition-transform duration-300"></div>
                </div>
                
                <div class="safari-address-bar bg-white/80 backdrop-blur-lg px-3 py-1.5 rounded-lg flex-1 flex items-center justify-center text-[11px] font-semibold text-slate-600 tracking-tight truncate border border-slate-200/50">
                    <svg class="w-3 h-3 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    ${domain}
                </div>
            </div>

            <div class="iframe-wrapper relative w-full aspect-video bg-slate-100 group-hover:bg-white transition-colors">
                <div class="iframe-overlay absolute inset-0 z-10 cursor-pointer"></div>
                
                <div class="iframe-loader absolute inset-0 flex items-center justify-center z-20 bg-slate-50 transition-opacity duration-500">
                    <div class="relative flex items-center justify-center">
                        <div class="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                </div>

                <div class="iframe-container h-full w-full ring-2 ring-inset ring-slate-900/10">
                    <iframe 
                        class="w-[125%] h-[125%] origin-top-left scale-[0.8] border-none safari-iframe opacity-0 transition-opacity duration-700" 
                        src="${url}" 
                        loading="lazy"
                        title="Preview ${title}">
                    </iframe>
                </div>
            </div>
        </div>
        
        <div class="mt-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 px-1">
            <div class="flex-1">
                <h3 class="font-extrabold text-slate-900 text-lg md:text-xl tracking-tight mb-1.5 group-hover:text-blue-600 transition-colors duration-300">
                    ${title}
                </h3>
                <p class="text-sm text-slate-600 leading-relaxed max-w-xs font-medium">
                    ${desc}
                </p>
            </div>
            
            <a href="${url}" target="_blank" 
               class="btn-access relative inline-flex items-center justify-center overflow-hidden group/btn bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-extrabold px-8 py-4 rounded-xl shadow-lg shadow-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/60">
               <span class="relative z-10 uppercase tracking-widest">Acessar</span>
            </a>
        </div>
    </article>`;

    const fragment = template.content.cloneNode(true);
    const iframe = fragment.querySelector('.safari-iframe');
    const loader = fragment.querySelector('.iframe-loader');

    const showIframe = () => {
        if (loader) loader.classList.add('opacity-0');
        if (iframe) iframe.classList.replace('opacity-0', 'opacity-100');
        setTimeout(() => loader?.remove(), 500);
    };

    iframe.addEventListener('load', showIframe);
    setTimeout(showIframe, 4000); // Fail-safe

    return fragment;
}

// fetch and inject an HTML component into a container element
async function loadComponent(targetId, url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
        const html = await res.text();
        const el = document.getElementById(targetId);
        if (el) el.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

// build page once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadComponent('main-header', 'components/header.html');
    loadComponent('main-footer', 'components/footer.html');

    const grid = document.getElementById('systems-grid');
    if (grid) {
        systems.forEach(sys => grid.appendChild(createSafariWindow(sys)));
    }
}); // end DOMContentLoaded listener

