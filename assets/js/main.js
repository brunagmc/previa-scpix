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
