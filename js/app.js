// data for each system portal
const systems = [
    {
        title: 'Gestão de Projetos',
        url: 'https://secti.netlify.app',
        domain: 'secti.netlify.app',
        desc: 'Módulo de planejamento e acompanhamento de metas.',
        // Tema Rosa/Magenta
        theme: {
            title: 'group-hover:text-pink-600',
            btn: 'hover:bg-pink-600',
            ring: 'focus:ring-pink-500/30',
            badge: 'group-hover:bg-pink-100 group-hover:text-pink-700 text-pink-600/70'
        }
    },
    {
        title: 'Gestão de Contratos',
        url: 'https://secti-contratos.netlify.app/',
        domain: 'secti-contratos.netlify.app',
        desc: 'Administração de documentos e vigências contratuais.',
        // Tema Teal/Ciano
        theme: {
            title: 'group-hover:text-teal-600',
            btn: 'hover:bg-teal-600',
            ring: 'focus:ring-teal-500/30',
            badge: 'group-hover:bg-teal-100 group-hover:text-teal-700 text-teal-600/70'
        }
    },
    {
        title: 'Painel Conecta Bahia',
        url: 'https://conectabahia.netlify.app/',
        domain: 'conectabahia.netlify.app',
        desc: 'Mapa interativo de praças com Wi-Fi gratuito no estado.',
        image: 'assets/images/mapa.png',
        // Tema Amarelo/Dourado
        theme: {
            title: 'group-hover:text-yellow-600',
            btn: 'hover:bg-yellow-500 hover:text-slate-900', // Ajuste de contraste pro texto
            ring: 'focus:ring-yellow-500/30',
            badge: 'group-hover:bg-yellow-100 group-hover:text-yellow-800 text-yellow-600/80'
        }
    },
    {
        title: 'Observatório de CT&I',
        url: 'https://simcc.uesc.br/observatorio',
        domain: 'simcc.uesc.br',
        desc: 'Painéis com dados sobre produção científica e inovação.',
        // Tema Laranja
        theme: {
            title: 'group-hover:text-orange-600',
            btn: 'hover:bg-orange-600',
            ring: 'focus:ring-orange-500/30',
            badge: 'group-hover:bg-orange-100 group-hover:text-orange-700 text-orange-600/70'
        }
    },
    {
        title: 'Mapeamento EPT',
        url: 'https://mapfilterdemo.netlify.app/',
        domain: 'mapfilterdemo.netlify.app',
        desc: 'Mapeamento das unidades de ensino profissional e tecnológica.',
        // Tema Azul Secundário
        theme: {
            title: 'group-hover:text-blue-600',
            btn: 'hover:bg-blue-600',
            ring: 'focus:ring-blue-500/30',
            badge: 'group-hover:bg-blue-100 group-hover:text-blue-700 text-blue-600/70'
        }
    },
    {
        title: 'SECTISPEAK',
        url: 'https://cloudspeak.netlify.app/',
        domain: 'cloudspeak.netlify.app',
        desc: 'Plataforma de apresentações interativas em tempo real.',
        // Tema Verde (para fechar a paleta)
        theme: {
            title: 'group-hover:text-emerald-600',
            btn: 'hover:bg-emerald-600',
            ring: 'focus:ring-emerald-500/30',
            badge: 'group-hover:bg-emerald-100 group-hover:text-emerald-700 text-emerald-600/70'
        }
    },
    {
        title: 'Painel SECTI Territórios',
        url: 'https://secti-territorios.netlify.app/',
        domain: 'secti-territorios.netlify.app',
        desc: 'Visualização interativa das características de ciência, tecnologia e inovação nos territórios de identidade da Bahia.',
        image: 'assets/images/territorios.png',
        // Tema Lima
        theme: {
            title: 'group-hover:text-lime-600',
            btn: 'hover:bg-lime-600 hover:text-slate-900',
            ring: 'focus:ring-lime-500/30',
            badge: 'group-hover:bg-lime-100 group-hover:text-lime-800 text-lime-600/80'
        }
    }
];

function createSafariWindow({ title, url, domain, desc, image, theme }) {
    const template = document.createElement('template');

    // Substituí as cores fixas pelas variáveis 'theme.badge', 'theme.title', etc.
    template.innerHTML = `
    <article class="group relative flex flex-col w-full bg-white rounded-[24px] p-3 border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-1">
        
        <div class="relative w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/50">
            
            <div class="bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between z-10 relative border-b border-slate-200/50">
                <div class="flex space-x-1.5 w-20">
                    <div class="w-2.5 h-2.5 rounded-full bg-slate-200 group-hover:bg-rose-400 transition-colors duration-300"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-slate-200 group-hover:bg-amber-400 transition-colors duration-300"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-slate-200 group-hover:bg-emerald-400 transition-colors duration-300"></div>
                </div>
                
                <div class="flex-1 flex justify-center">
                    <div class="bg-slate-100/80 text-[10px] sm:text-xs font-medium px-4 py-1.5 rounded-full max-w-[220px] truncate flex items-center gap-1.5 transition-colors ${theme.badge}">
                        <svg class="w-3 h-3 current-color" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        ${domain}
                    </div>
                </div>
                
                <div class="w-20"></div> 
            </div>

            <div class="relative aspect-video w-full bg-slate-50 overflow-hidden">
                <div class="iframe-loader absolute inset-0 flex flex-col items-center justify-center z-20 bg-slate-50 transition-opacity duration-500">
                    <div class="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-3"></div>
                    <span class="text-xs font-medium text-slate-400 animate-pulse">Carregando interface...</span>
                </div>

                ${image ? `
                    <img class="w-full h-full object-cover safari-iframe opacity-0 transition-all duration-700 transform group-hover:scale-105" src="${image}" alt="Preview ${title}" loading="lazy" />
                ` : `
                    <iframe class="w-[125%] h-[125%] origin-top-left scale-[0.8] border-none safari-iframe opacity-0 transition-opacity duration-700 pointer-events-none bg-white" src="${url}" loading="lazy" title="Preview ${title}"></iframe>
                `}
                
                <a href="${url}" target="_blank" class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors duration-300 z-10" aria-label="Acessar ${title}"></a>
            </div>
        </div>

        <div class="mt-4 px-2 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex-1">
                <h3 class="font-bold text-slate-900 text-lg tracking-tight ${theme.title} transition-colors duration-300">
                    ${title}
                </h3>
                <p class="text-sm text-slate-500 mt-1 leading-relaxed max-w-sm">
                    ${desc}
                </p>
            </div>
            
            <a href="${url}" target="_blank" class="shrink-0 inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-4 ${theme.btn} ${theme.ring}">
                Acessar
                <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
            </a>
        </div>
    </article>`;

    // ... o restante do seu código (fragment, loaders) continua exatamente igual
    const fragment = template.content.cloneNode(true);
    const contentEl = fragment.querySelector('.safari-iframe'); 
    const loader = fragment.querySelector('.iframe-loader');

    const showIframe = () => {
        if (loader) loader.classList.add('opacity-0');
        if (contentEl) contentEl.classList.replace('opacity-0', 'opacity-100');
        setTimeout(() => loader?.remove(), 500);
    };

    if (contentEl) {
        contentEl.addEventListener('load', showIframe);
    }
    setTimeout(showIframe, 4000); 

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
