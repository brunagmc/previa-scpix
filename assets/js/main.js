/* SCPix — JS único: mega menu (teclado/toque), menu mobile. Sem dependências. */
(function () {
  "use strict";

  /* ---- Mega menu desktop: aria-expanded, clique/toque e Esc ---- */
  var paineis = document.querySelectorAll(".tem-painel");
  paineis.forEach(function (li) {
    var botao = li.querySelector(".item-menu");
    if (!botao) return;
    var definir = function (aberto) {
      botao.setAttribute("aria-expanded", aberto ? "true" : "false");
      li.classList.toggle("aberto", aberto);
      li.classList.remove("fechado");
    };
    li.addEventListener("mouseenter", function () { definir(true); });
    li.addEventListener("mouseleave", function () { definir(false); });
    li.addEventListener("focusin", function () { definir(true); });
    li.addEventListener("focusout", function (e) { if (!li.contains(e.relatedTarget)) definir(false); });
    botao.addEventListener("click", function () { definir(botao.getAttribute("aria-expanded") !== "true"); });
    li.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        definir(false);
        li.classList.add("fechado");
        botao.focus();
      }
    });
  });

  /* ---- Menu mobile em tela cheia ---- */
  var abrir = document.querySelector('.topo .botao-menu');
  var menu = document.getElementById("menu-mobile");
  if (!abrir || !menu) return;
  var fechar = menu.querySelector("[data-fechar]");

  function focaveis() {
    return menu.querySelectorAll('a[href], button, summary');
  }
  function abrirMenu() {
    menu.hidden = false;
    abrir.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    fechar.focus();
  }
  function fecharMenu() {
    menu.hidden = true;
    abrir.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    abrir.focus();
  }
  abrir.addEventListener("click", abrirMenu);
  fechar.addEventListener("click", fecharMenu);
  menu.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { fecharMenu(); return; }
    if (e.key !== "Tab") return;
    var itens = Array.prototype.filter.call(focaveis(), function (el) { return el.offsetParent !== null; });
    var primeiro = itens[0], ultimo = itens[itens.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });
})();

/* ---- Formulário de simulação: monta a mensagem e abre o WhatsApp ---- */
(function () {
  "use strict";
  var form = document.getElementById("form-simulacao");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var erro = form.querySelector(".erro-campo");
    if (!form.checkValidity()) { erro.hidden = false; return; }
    erro.hidden = true;
    var d = new FormData(form);
    var msg = "Olá, SCPix! Sou " + d.get("nome") + ", de " + d.get("cidade") +
      ". Quero simular R$ " + d.get("valor") + ". Prefiro: " + d.get("parcelas") + ".";
    window.location.href = form.getAttribute("data-whats") + encodeURIComponent(msg);
  });
})();

/* ---- Pop-up de saída: uma vez por visita ----
   Computador: quando o mouse sai pelo topo da janela (indo para fechar a aba ou trocar de site).
   Celular: quando a pessoa rola rápido para cima depois de ter lido pelo menos metade da página.
   Não aparece nos primeiros 8 segundos, nem na página /obrigado/, nem com o menu aberto. */
(function () {
  "use strict";
  var popup = document.getElementById("popup-saida");
  if (!popup || typeof popup.showModal !== "function") return;
  if (location.pathname.indexOf("/obrigado/") !== -1) return;
  var CHAVE = "scpix-popup-saida";
  var jaViu = false;
  try { jaViu = sessionStorage.getItem(CHAVE) === "1"; } catch (e) {}
  if (jaViu) return;
  var liberado = false;
  setTimeout(function () { liberado = true; }, 8000);
  var mostrou = false;
  function mostrar() {
    if (mostrou || !liberado) return;
    var menu = document.getElementById("menu-mobile");
    if (menu && !menu.hidden) return;
    mostrou = true;
    try { sessionStorage.setItem(CHAVE, "1"); } catch (e) {}
    popup.showModal();
  }
  popup.querySelectorAll("[data-fechar-popup]").forEach(function (el) {
    el.addEventListener("click", function () { popup.close(); });
  });
  popup.addEventListener("click", function (e) { if (e.target === popup) popup.close(); });
  /* computador */
  document.addEventListener("mouseout", function (e) {
    if (!e.relatedTarget && e.clientY <= 0) mostrar();
  });
  /* celular */
  if (window.matchMedia("(pointer: coarse)").matches) {
    var ultimoY = window.scrollY, ultimoT = Date.now(), maxY = 0;
    window.addEventListener("scroll", function () {
      var y = window.scrollY, t = Date.now();
      maxY = Math.max(maxY, y);
      var leuMetade = maxY > (document.documentElement.scrollHeight - window.innerHeight) * 0.5;
      var subiuRapido = (ultimoY - y) > 140 && (t - ultimoT) < 250;
      if (leuMetade && subiuRapido) mostrar();
      ultimoY = y; ultimoT = t;
    }, { passive: true });
  }
})();

/* ---- Calculadora de simulação ----
   Usa só as taxas finais para o cliente (geradas por scripts/precos.py no build).
   "Quero receber X": passa = X / (1 - taxa). "Vou passar X": recebe = X * (1 - taxa).
   Faixa de taxa decidida pelo valor recebido (até o limite ou acima). */
(function () {
  "use strict";
  var caixa = document.getElementById("calculadora");
  if (!caixa) return;
  var dados = JSON.parse(document.getElementById("calculadora-taxas").textContent);
  var form = caixa.querySelector(".calc-form");
  var campoValor = document.getElementById("calc-valor");
  var campoParcelas = document.getElementById("calc-parcelas");
  var brl = function (v) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  var numero = function (txt) { var d = String(txt).replace(/\D/g, ""); return d ? parseInt(d, 10) : 0; };

  function taxa(band, n, recebe) {
    return dados[band][recebe <= dados.limite ? "ate" : "acima"][n - 1] / 100;
  }
  function calcular() {
    var modo = form.modo.value, band = form.bandeira.value, n = parseInt(campoParcelas.value, 10);
    var valor = numero(campoValor.value);
    document.getElementById("calc-parcelas-valor").textContent = n + "x";
    document.getElementById("calc-valor-rotulo").textContent = modo === "receber" ? "Quanto você quer receber na conta" : "Quanto você vai passar no cartão";
    var recebe, passa;
    if (modo === "receber") {
      recebe = valor;
      passa = recebe / (1 - taxa(band, n, recebe));
    } else {
      passa = valor;
      recebe = passa * (1 - taxa(band, n, 0));            /* testa a faixa "até o limite" */
      if (recebe > dados.limite) recebe = passa * (1 - taxa(band, n, dados.limite + 1));
    }
    var parcela = passa / n;
    var r1 = document.getElementById("calc-r1"), r3 = document.getElementById("calc-r3");
    document.getElementById("calc-r1-rotulo").textContent = modo === "receber" ? "Passa no cartão" : "Você recebe via Pix";
    document.getElementById("calc-r3-rotulo").textContent = modo === "receber" ? "Você recebe via Pix" : "Passa no cartão";
    if (!valor) { r1.textContent = "—"; r3.textContent = "—"; document.getElementById("calc-r2").textContent = "—"; return; }
    r1.textContent = brl(modo === "receber" ? passa : recebe);
    r3.textContent = brl(modo === "receber" ? recebe : passa);
    document.getElementById("calc-r2").textContent = n + "x de " + brl(parcela);
    var nomeBand = band === "visa" ? "Visa/Mastercard" : "Elo/Hipercard";
    var msg = "Olá, SCPix! Fiz a simulação no site: receber " + brl(recebe) + ", passando " + brl(passa) +
      " em " + n + "x de " + brl(parcela) + " (" + nomeBand + "). Quero agendar o atendimento.";
    document.getElementById("calc-enviar").href = caixa.getAttribute("data-whats") + encodeURIComponent(msg);
  }
  campoValor.addEventListener("input", function () {
    var v = numero(campoValor.value);
    campoValor.value = v ? v.toLocaleString("pt-BR") : "";
    calcular();
  });
  form.addEventListener("change", calcular);
  campoParcelas.addEventListener("input", calcular);
  calcular();
})();

/* ---- Thassia: chat do site ----
   Manda a conversa para o servidor da Thassia (data-api) e mostra a resposta.
   Quando a resposta traz uma mensagem de WhatsApp, vira um botão que abre a conversa com o resumo pronto.
   A conversa fica só nesta aba (sessionStorage). data-api="teste" responde sem servidor, para conferir o visual. */
(function () {
  "use strict";
  var raiz = document.querySelector(".thassia");
  if (!raiz) return;
  var api = raiz.getAttribute("data-api"), whats = raiz.getAttribute("data-whats");
  var botao = raiz.querySelector(".thassia-abrir"), painel = raiz.querySelector(".thassia-painel");
  var lista = raiz.querySelector(".thassia-mensagens"), form = raiz.querySelector(".thassia-form");
  var campo = form.querySelector("textarea"), mandar = form.querySelector("button");
  var MAX = 24, CHAVE = "scpix-thassia";
  var historico = [], whatsFinal = {};

  function guardar() { try { sessionStorage.setItem(CHAVE, JSON.stringify({ h: historico, w: whatsFinal })); } catch (e) {} }
  function rolar() { lista.scrollTop = lista.scrollHeight; }
  function balao(texto, quem) {
    var div = document.createElement("div");
    div.className = "thassia-msg thassia-" + quem;
    texto.split(/\n{2,}/).forEach(function (bloco) {
      var p = document.createElement("p");
      p.textContent = bloco.trim();
      div.appendChild(p);
    });
    lista.appendChild(div);
    rolar();
    return div;
  }
  function botaoWhats(msg) {
    var a = document.createElement("a");
    a.className = "botao botao-primario thassia-whats";
    a.href = whats + encodeURIComponent(msg);
    a.textContent = "Combinar o atendimento pelo WhatsApp";
    lista.appendChild(a);
    rolar();
  }
  function abrir(sim) {
    painel.hidden = !sim;
    botao.setAttribute("aria-expanded", sim ? "true" : "false");
    if (sim) { rolar(); campo.focus(); } else { botao.focus(); }
  }
  botao.addEventListener("click", function () { abrir(painel.hidden); });
  raiz.querySelector(".thassia-fechar").addEventListener("click", function () { abrir(false); });
  painel.addEventListener("keydown", function (e) { if (e.key === "Escape") abrir(false); });

  try {
    var salvo = JSON.parse(sessionStorage.getItem(CHAVE) || "null");
    if (salvo && Array.isArray(salvo.h)) {
      historico = salvo.h; whatsFinal = salvo.w || {};
      historico.forEach(function (m, i) {
        balao(m.content, m.role === "user" ? "sua" : "dela");
        if (whatsFinal[i]) botaoWhats(whatsFinal[i]);
      });
    }
  } catch (e) {}

  function perguntar(msgs) {
    if (api === "teste") {
      return new Promise(function (ok) {
        setTimeout(function () {
          ok({ texto: "Modo de teste: aqui aparece a resposta da Thassia quando o servidor estiver ligado.",
               whatsapp: "Olá, SCPix! Quero simular dinheiro no limite do cartão." });
        }, 700);
      });
    }
    return fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  campo.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var texto = campo.value.trim();
    if (!texto || mandar.disabled) return;
    if (historico.length >= MAX - 1) {
      balao("Para seguir com a sua simulação, fale com a nossa equipe pelo WhatsApp.", "dela");
      botaoWhats("Olá, SCPix! Conversei com a Thassia no site e quero combinar o atendimento.");
      return;
    }
    campo.value = "";
    balao(texto, "sua");
    historico.push({ role: "user", content: texto });
    guardar();
    mandar.disabled = true;
    var aguarde = balao("Thassia está escrevendo", "dela");
    aguarde.classList.add("thassia-digitando");
    perguntar(historico).then(function (r) {
      aguarde.remove();
      historico.push({ role: "assistant", content: r.texto });
      balao(r.texto, "dela");
      if (r.whatsapp) { whatsFinal[historico.length - 1] = r.whatsapp; botaoWhats(r.whatsapp); }
      guardar();
    }).catch(function () {
      aguarde.remove();
      historico.pop();
      guardar();
      balao("Não consegui responder agora. Pelo WhatsApp a nossa equipe responde você.", "dela");
      botaoWhats("Olá, SCPix! " + texto);
    }).then(function () { mandar.disabled = false; campo.focus(); });
  });
})();
