document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. COMPROBACIÓN GLOBAL DE SESIÓN ---
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    const loginForm = document.getElementById('login-form');
    const dashboardGrid = document.getElementById('form-grid');

    // ==========================================
    // LÓGICA DE LA PÁGINA DE LOGIN (index.html)
    // ==========================================
    if (loginForm) {
        if (session) {
            window.location.replace('dashboard.html');
            return;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('error-msg');
            const submitBtn = document.getElementById('submit-btn');

            submitBtn.textContent = 'A verificar...';
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
            errorMsg.classList.add('hidden');

            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                errorMsg.textContent = 'Credenciais inválidas. Tente novamente.';
                errorMsg.classList.remove('hidden');
                
                submitBtn.textContent = 'Aceder ao Dashboard';
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }

    // ==========================================
    // LÓGICA DE LA PÁGINA DASHBOARD (dashboard.html)
    // ==========================================
    if (dashboardGrid) {
        if (!session) {
            window.location.replace('index.html');
            return; 
        } else {
            document.body.classList.remove('hidden');
        }

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                await window.supabaseClient.auth.signOut();
                window.location.replace('index.html');
            });
        }

        const sortSelect = document.getElementById('sort-options');
        const btnGrid = document.getElementById('view-grid');
        const btnList = document.getElementById('view-list');
        
        let allForms = [];
        let displayedForms = [];
        
        let currentView = window.innerWidth < window.Config.UI.MOBILE_BREAKPOINT ? 'list' : 'grid';

        // --- FETCH DATA (FORZADO POR AJAX / FETCH NATIVO) ---
        async function fetchPortalData() {
            dashboardGrid.innerHTML = '<p class="text-slate-500 text-center col-span-full py-12">A carregar recursos...</p>';

            try {
                // 1. Construimos la URL de la API REST para hacer la petición AJAX
                const endpoint = `${window.Config.SUPABASE_URL}/rest/v1/${window.Config.TABLES.PORTAL_LINKS}?active=eq.true&select=*`;
                
                // 2. Extraemos el Token de seguridad de la sesión actual
                const token = session.access_token;

                // 3. Ejecutamos el AJAX inyectando las credenciales a la fuerza
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'apikey': window.Config.SUPABASE_ANON_KEY,
                        'Authorization': `${token}`, // <-- Esto evita el error 401 si el usuario está logueado
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status}`);
                }

                let data = await response.json();

                // 4. Ordenamos los datos localmente en JS por si la base de datos los manda desordenados
                data.sort((a, b) => {
                    if (a.customer_name < b.customer_name) return -1;
                    if (a.customer_name > b.customer_name) return 1;
                    return a.title.localeCompare(b.title);
                });

                return data;

            } catch (error) {
                console.error("Erro ao carregar o portal via AJAX:", error);
                // Mensaje más descriptivo por si vuelve a dar 401
                dashboardGrid.innerHTML = '<p class="text-red-500 text-center col-span-full font-medium">Erro 401/403: Acesso negado pela base de dados.<br><span class="text-sm text-slate-500">Verifique as políticas RLS (Row Level Security) da tabela no Supabase.</span></p>';
                return [];
            }
        }

        allForms = await fetchPortalData();
        displayedForms = [...allForms];

        const customerNames = [...new Set(allForms.map(item => item.customer_name))];
        if (sortSelect) {
            customerNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                sortSelect.appendChild(option);
            });

            const savedCustomer = localStorage.getItem('selectedCustomer');
            if (savedCustomer && (savedCustomer === 'all' || customerNames.includes(savedCustomer))) {
                sortSelect.value = savedCustomer; 
                displayedForms = (savedCustomer === 'all') 
                    ? [...allForms] 
                    : allForms.filter(f => f.customer_name === savedCustomer);
            }
        }

        function updateViewButtons() {
            if (!btnGrid || !btnList) return;
            if (currentView === 'grid') {
                btnGrid.classList.add('bg-white', 'shadow-sm', 'text-blue-600');
                btnGrid.classList.remove('text-slate-500', 'hover:text-slate-700');
                btnList.classList.remove('bg-white', 'shadow-sm', 'text-blue-600');
                btnList.classList.add('text-slate-500', 'hover:text-slate-700');
            } else {
                btnList.classList.add('bg-white', 'shadow-sm', 'text-blue-600');
                btnList.classList.remove('text-slate-500', 'hover:text-slate-700');
                btnGrid.classList.remove('bg-white', 'shadow-sm', 'text-blue-600');
                btnGrid.classList.add('text-slate-500', 'hover:text-slate-700');
            }
        }

        function render() {
            dashboardGrid.innerHTML = '';
            
            dashboardGrid.className = currentView === 'grid' 
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
                                <h2 class="text-[13px] font-bold text-slate-800 line-clamp-2 leading-tight">${form.title}</h2>
                            </div>
                            <p class="text-slate-500 text-[10px] mb-4 line-clamp-3 leading-relaxed">${form.description || ''}</p>
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
                                <h2 class="text-sm font-bold text-slate-800 line-clamp-1">${form.title}</h2>
                                <p class="text-[10px] text-slate-400">${form.customer_name}</p>
                            </div>
                        </div>
                        <i data-lucide="chevron-right" class="text-slate-300 group-hover:text-blue-500 transition-colors"></i>
                    `;
                }

                card.onclick = () => window.open(form.url, '_blank');
                dashboardGrid.appendChild(card);
            });

            updateViewButtons();
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const selected = e.target.value;
                localStorage.setItem('selectedCustomer', selected);
                displayedForms = (selected === 'all') 
                    ? [...allForms] 
                    : allForms.filter(f => f.customer_name === selected);
                render();
            });
        }

        if (btnGrid && btnList) {
            btnGrid.onclick = () => { currentView = 'grid'; render(); };
            btnList.onclick = () => { currentView = 'list'; render(); };
        }

        render(); 
    }
});