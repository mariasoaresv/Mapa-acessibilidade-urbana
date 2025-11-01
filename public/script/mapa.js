document.addEventListener('DOMContentLoaded', () => {

    const userDataJson = sessionStorage.getItem('usuarioLogado');

    if (userDataJson) {
        const userData = JSON.parse(userDataJson);
        const nomeUsuarioElement = document.getElementById('nome-usuario');
        
        if (nomeUsuarioElement && userData.username) {
            const nomeCompleto = userData.username;
            const partesDoNome = nomeCompleto.split(' ');
            const primeiroNome = partesDoNome[0];
            
            nomeUsuarioElement.textContent = primeiroNome + '!'; 
        } else {
            console.error('Elemento #nome-usuario não foi encontrado ou userData.username não existe.');
        }

    } else {
        alert('Por favor, faça login para acessar o mapa.');
        console.log('Nenhum usuário logado encontrado na sessão. Redirecionando...');
        window.location.href = 'index.html';
        return; 
    }

    const geoSearchProvider = new GeoSearch.OpenStreetMapProvider();

    if (document.getElementById('mapa-container')) {
        
        const map = L.map('mapa-container').setView([20, 0], 2); 

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const searchControl = new GeoSearch.GeoSearchControl({
            provider: geoSearchProvider,
            style: 'bar', 
            showMarker: false, 
            autoClose: true,
            keepResult: true,
        });
        map.addControl(searchControl);

        window.myMap = map;
    }

    const popupContainer = document.getElementById('popup-detalhes-container');
    
    const popupConteudo = document.querySelector('.popup-detalhes-conteudo'); 
    
    const popupForm = document.getElementById('popup-detalhes-form');
    const popupCloseBtn = document.getElementById('popup-detalhes-fechar');
    const popupIconImg = document.getElementById('popup-detalhes-icone');
    
    let marcadorSendoEditado = null;

    if (window.myMap) {
        const map = window.myMap;
        const mapContainer = document.getElementById('mapa-container');
        const icons = document.querySelectorAll('.draggable-icon');

        icons.forEach(icon => {
            icon.addEventListener('dragstart', (e) => {
                const data = { id: e.target.id, src: e.target.src };
                e.dataTransfer.setData('application/json', JSON.stringify(data));
            });
        });

        mapContainer.addEventListener('dragover', (e) => {
            e.preventDefault(); 
        });

        mapContainer.addEventListener('drop', (e) => {
            e.preventDefault();

            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const iconSrc = data.src;
            const latLng = map.mouseEventToLatLng(e); 
            
            const customIcon = L.icon({
                iconUrl: iconSrc,
                iconSize: [33, 45],
                iconAnchor: [16, 32], 
            });

            const marker = L.marker(latLng, { 
                icon: customIcon,
                draggable: true 
            }).addTo(map);

            marker.dados = {
                tipo: data.id,
                titulo: "",
                descricao: "",
                foto: null
            };

            marcadorSendoEditado = marker;

            popupForm.reset(); 
            popupIconImg.src = iconSrc; 
                             
            popupContainer.classList.remove('ativo');
            

            popupConteudo.classList.add('ativo'); 

            // 6. Busca de endereço foi REMOVIDA
            

            // --- O que acontece ao CLICAR (Botão Esquerdo) ---
            marker.on('click', () => {
                const dados = marker.dados;
                
                // Se o marcador ainda não tem título, REABRE o popup de edição
                if (!dados.titulo) {
                    marcadorSendoEditado = marker;
                    
                    // Preenche o popup
                    document.getElementById('popup-detalhes-titulo').value = dados.titulo;
                    document.getElementById('popup-detalhes-observacao').value = dados.descricao;
                    document.getElementById('popup-detalhes-icone').src = marker.options.icon.options.iconUrl;

                    
                    popupContainer.classList.remove('popup-escondido'); // Mostra o fundo
                    
                    // --- MUDANÇA 3: Adiciona a classe .ativo aqui também ---
                    popupConteudo.classList.add('ativo'); 
                    
                    return;
                }

                // Se JÁ TEM título, mostra o balãozinho de visualização
                let popupConteudo = `<b>${dados.titulo}</b><br>${dados.descricao}`;


                L.popup()
                    .setLatLng(marker.getLatLng())
                    .setContent(popupConteudo)
                    .openOn(map);
            });


            // --- O que acontece ao CLICAR (Botão Direito) ---
            marker.on('contextmenu', (e) => { // 'contextmenu' é o clique direito
                if (confirm('Deseja excluir este ícone?')) {
                    map.removeLayer(marker); // Remove o marcador do mapa
                }
            });
        });
    }

    // O que acontece quando clicamos em "Enviar" no popup de Detalhes
    popupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (marcadorSendoEditado) {
            // Pega os dados do formulário
            const titulo = document.getElementById('popup-detalhes-titulo').value;
            const observacao = document.getElementById('popup-detalhes-observacao').value;

            // Salva os dados DENTRO do marcador
            marcadorSendoEditado.dados.titulo = titulo;
            marcadorSendoEditado.dados.descricao = observacao;

            // Esconde o popup
            popupContainer.classList.add('popup-escondido'); // Esconde o fundo
            
            // --- MUDANÇA 4: Remove a classe .ativo para o popup "encolher" ---
            popupConteudo.classList.remove('ativo'); 
            
            marcadorSendoEditado = null; // Limpa a variável
        }
    });

    // O que acontece quando clicamos no "X" para fechar
    popupCloseBtn.addEventListener('click', () => {
        popupContainer.classList.add('popup-escondido'); // Esconde o fundo
        
        // --- MUDANÇA 4 (Repetida): Remove a classe .ativo ---
        popupConteudo.classList.remove('ativo');
        
        // Se estávamos *criando* um novo ícone (e não editando),
        // devemos removê-lo do mapa, pois foi cancelado.
        if (marcadorSendoEditado && !marcadorSendoEditado.dados.titulo) { // Se não tem título, é novo
            map.removeLayer(marcadorSendoEditado);
        }

        marcadorSendoEditado = null; // Limpa a variável
    });

}); // Fim do 'DOMContentLoaded'