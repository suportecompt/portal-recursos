document.addEventListener('DOMContentLoaded', async () => {
    // 1. Referencias al DOM
    const grid = document.getElementById('form-grid');
    const sortSelect = document.getElementById('sort-options');
    const btnGrid = document.getElementById('view-grid');
    const btnList = document.getElementById('view-list');
    
    let allForms = [];
    let displayedForms = [];
    let currentView = 'grid';

    // --- CARGA DE DATOS DESDE SUPABASE ---
    async function fetchPortalData() {
        const { data, error } = await window.supabaseClient
            .from('portal_links')
            .select('*')
            .eq('active', true)
            .order('customer_name', { ascending: true });

        if (error) {
            console.error("Error cargando el portal:", error);
            return [];
        }
        return data;
    }

    // Justo antes de: const rawData = await fetchPortalData();
    grid.innerHTML = '<p class="text-slate-500 text-center col-span-full">A carregar recursos...</p>';

    // Inicialización de datos
    const rawData = await fetchPortalData();
    allForms = rawData;
    displayedForms = [...allForms];

    // Llenar el select de clientes dinámicamente
    const customerNames = [...new Set(allForms.map(item => item.customer_name))];
    if (sortSelect) {
        customerNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            sortSelect.appendChild(option);
        });
    }

    // --- FUNCIÓN RENDER ---
    function render() {
        if (!grid) return;
        grid.innerHTML = '';
        
        // Clases de contenedor según la vista
        grid.className = currentView === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-fr" 
            : "flex flex-col gap-4";
        
        displayedForms.forEach(form => {
            const card = document.createElement('div');
            
            if (currentView === 'grid') {
                card.className = 'group bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300 cursor-pointer flex flex-col h-full';
                card.innerHTML = `
                    <div class="flex flex-col flex-1">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <i data-lucide="${form.icon || 'help-circle'}" class="w-4 h-4"></i>
                            </div>
                            <h2 class="text-sm font-bold text-slate-800 line-clamp-2">${form.title}</h2>
                        </div>
                        <p class="text-slate-500 text-[10px] mb-4 line-clamp-3">${form.description || ''}</p>
                    </div>
                    <div class="pt-3 border-t border-slate-100 mt-auto shrink-0">
                        <div class="flex items-center text-[10px] font-semibold text-slate-900 group-hover:text-blue-600">
                            Abrir <i data-lucide="external-link" class="w-3 h-3 ml-1"></i>
                        </div>
                    </div>
                `;
            } else {
                card.className = 'group bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-blue-500 transition-all cursor-pointer flex items-center justify-between';
                card.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <i data-lucide="${form.icon || 'help-circle'}" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-bold text-slate-800 line-clamp-1">${form.title}</h2>
                            <p class="text-xs text-slate-400">${form.customer_name}</p>
                        </div>
                    </div>
                    <i data-lucide="chevron-right" class="text-slate-300 group-hover:text-blue-500 transition-colors"></i>
                `;
            }

            card.onclick = () => window.open(form.url, '_blank');
            grid.appendChild(card);
        });

        // Refrescar iconos de Lucide
        lucide.createIcons();
    }

    // --- EVENT LISTENERS ---

    // Filtrado por cliente
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const selected = e.target.value;
            displayedForms = selected === 'all' 
                ? [...allForms] 
                : allForms.filter(f => f.customer_name === selected);
            render();
        });
    }

    // Cambio de vista (Grid/List)
    if (btnGrid && btnList) {
        btnGrid.onclick = () => {
            currentView = 'grid';
            btnGrid.classList.add('bg-white', 'shadow-sm', 'text-blue-600');
            btnList.classList.remove('bg-white', 'shadow-sm', 'text-blue-600');
            render();
        };

        btnList.onclick = () => {
            currentView = 'list';
            btnList.classList.add('bg-white', 'shadow-sm', 'text-blue-600');
            btnGrid.classList.remove('bg-white', 'shadow-sm', 'text-blue-600');
            render();
        };
    }

    // Render inicial
    render(); 
});