const iconeChat = document.getElementById("iconeChat");
const cardChat = document.getElementById("cardChat");
const textChat = document.querySelector(".textChat");

const historicoChat = document.getElementById("historicoChat"); 
const textHeader = document.querySelector(".textHeader"); 

const inputMessage = document.getElementById("inputMessage");
const enviarPerguntaBtn = document.getElementById("enviarPergunta");

// 🟢 CORREÇÃO CRÍTICA 1: Endpoint completo com o sufixo '/chat'
const N8N_ENDPOINT = "https://n8n.biodinamica.com.br/webhook/d2ae52db-b30e-44ee-bbd2-e1caf007c4ba/chat";

let cardAberto = false;
let sessionId = null; // Adicionado para gerenciar o estado da conversa, como no script1.js

// ===========================================
// 🟢 FUNÇÃO PARA ADICIONAR MENSAGEM DO BOT
// ===========================================
function adicionarMensagemBot(texto, isLoading = false) {
    const respostaBot = document.createElement("p");
    respostaBot.classList.add("textHeader"); // Estilo para mensagem do bot
    
    if (isLoading) {
        respostaBot.id = 'loading-message';
        // Você pode adicionar um estilo CSS para o loading, se quiser
    }
    
    // ⚠️ CORREÇÃO CRÍTICA APLICADA: Usa innerHTML para renderizar tags <a> clicáveis
    respostaBot.innerHTML = texto;
    historicoChat.appendChild(respostaBot);
    historicoChat.scrollTop = historicoChat.scrollHeight; // Rola para o final
    
    return isLoading ? respostaBot : null;
}


// ===========================================
// 🟢 FUNÇÃO PARA ENVIAR MENSAGEM (COM VISUALIZAÇÃO E INTEGRAÇÃO N8N)
// ===========================================
async function enviarMensagem() {
  const mensagem = inputMessage.value.trim();

  if (mensagem !== "" && historicoChat) {
    
    // 1. Cria e exibe a mensagem do usuário imediatamente
    const novaMensagem = document.createElement("p");
    novaMensagem.classList.add("msgUser"); 
    novaMensagem.textContent = mensagem;
    historicoChat.appendChild(novaMensagem);

    // 2. Limpa o input e foca
    inputMessage.value = '';
    inputMessage.focus(); 
    historicoChat.scrollTop = historicoChat.scrollHeight;

    // 3. Exibe um placeholder de "Digitando..." e o salva para remoção
    const loadingMessage = adicionarMensagemBot("Digitando...", true);

    // 4. INTEGRAÇÃO COM N8N: Envia a mensagem para o backend
    try {
        const response = await fetch(N8N_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Enviando chatInput e sessionId (como no script1.js)
            body: JSON.stringify({ 
                chatInput: mensagem,
                sessionId: sessionId || ""
            }),
        });

        // Remove a mensagem de 'Digitando...'
        if (loadingMessage && loadingMessage.parentNode) {
            historicoChat.removeChild(loadingMessage); 
        }
        
        // Tentativa de ler a resposta como JSON
        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.error("Erro ao ler JSON:", await response.text());
            throw new Error(`Resposta inválida do servidor: ${response.status}`);
        }
        
        if (!response.ok) {
            // Tenta obter uma mensagem de erro do JSON de resposta (se o n8n enviar)
            const errorMessage = data.text || data.message || `Erro HTTP: ${response.status}`;
            throw new Error(errorMessage);
        }

        // 5. 🟢 CORREÇÃO CRÍTICA 2: Busca a resposta na chave 'text' (ou 'message')
        // OBS: Certifique-se que o n8n está enviando a tag <a href="..."></a> na resposta.
        const respostaDoBot = data.text || data.message || "Desculpe, não consegui obter uma resposta válida do servidor.";
        
        adicionarMensagemBot(respostaDoBot);
        
        // 6. Atualiza sessionId para manter o estado da conversa (como no script1.js)
        if (data.sessionId) {
            sessionId = data.sessionId;
        }

    } catch (error) {
        // Remove a mensagem de 'Digitando...' (em caso de erro)
        if (loadingMessage && loadingMessage.parentNode) {
            historicoChat.removeChild(loadingMessage);
        }
        
        console.error("Erro na comunicação:", error);
        adicionarMensagemBot("❌ Erro ao se comunicar com o assistente. Verifique o console.");
    }
  }
}

// 🟢 Adiciona o evento de clique no botão de envio
if (enviarPerguntaBtn) {
  enviarPerguntaBtn.addEventListener("click", enviarMensagem);
}

// 🟢 Adiciona o evento de 'keypress' no campo de input
if (inputMessage) {
  inputMessage.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 
      enviarMensagem();
    }
  });
}

// ===========================================
// 🖱️ LÓGICA DE ABRIR/FECHAR O CARD
// ===========================================
iconeChat.addEventListener("click", () => {
  if (!cardAberto) {
    // === ABRIR CARD ===
    cardChat.style.display = "flex";

    requestAnimationFrame(() => {
      cardChat.classList.add("mostrar");
      
      // Rola para o final ao abrir
      if(historicoChat) {
          historicoChat.scrollTop = historicoChat.scrollHeight; 
      }
      
      // Coloca o foco no input
      inputMessage.focus();
    });

    // Esconde o texto do botão e troca o ícone
    textChat.style.display = "none";
    iconeChat.classList.remove("bi-chat-left");
    iconeChat.classList.add("bi-x-lg");

    cardAberto = true;
  } else {
    // === FECHAR CARD ===
    cardChat.classList.remove("mostrar");
    
    // Remove a exibição do card após a animação (300ms de transição)
    setTimeout(() => {
        // Restaura ícone e texto
        textChat.style.display = "inline-block"; 
        iconeChat.classList.remove("bi-x-lg");
        iconeChat.classList.add("bi-chat-left");

        // Remove o card da tela
        cardChat.style.display = "none";
    }, 300); 

    cardAberto = false;
  }
});

// ===========================================
// 🌙 LÓGICA DARK MODE ADICIONADO
// ===========================================
const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;
const icon = darkModeToggle ? darkModeToggle.querySelector('i') : null;

function applyDarkMode(isDark) {
    if (isDark) {
        body.classList.add("dark-mode");
        if (icon) {
            icon.classList.remove("bi-moon-fill");
            icon.classList.add("bi-sun-fill");
        }
    } else {
        body.classList.remove("dark-mode");
        if (icon) {
            icon.classList.remove("bi-sun-fill");
            icon.classList.add("bi-moon-fill");
        }
    }
}

function toggleDarkMode() {
    // 1. Alterna a classe no corpo
    const isCurrentlyDark = body.classList.contains("dark-mode");
    const isDark = !isCurrentlyDark;
    
    // 2. Aplica as mudanças
    applyDarkMode(isDark);

    // 3. Salva a preferência no localStorage
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
}

// 🟢 Adiciona evento de clique ao botão
if (darkModeToggle) {
    darkModeToggle.addEventListener("click", toggleDarkMode);
}

// 🟢 Verifica preferência ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se a preferência está salva ou se o sistema operacional prefere o modo escuro
    const savedMode = localStorage.getItem('darkMode');
    
    if (savedMode === 'enabled' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        applyDarkMode(true);
    } else {
        applyDarkMode(false);
    }
});