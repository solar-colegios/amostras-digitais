/* ============================================================
   Solar Colégios – Amostras  |  app.js
   Roteamento por hash:
     #/                  → matérias
     #/m/<materia>       → livros da matéria
     #/l/<slug>[/<pág>]  → visor do livro
   ============================================================ */
(() => {
  "use strict";

  const $app = document.getElementById("app");
  const $crumbs = document.getElementById("crumbs");
  const $toast = document.getElementById("toast");

  const DESCRICOES = {
    religiao: "Formação religiosa e valores para cada etapa da vida escolar.",
    "quero-querer": "Educação do caráter e da afetividade.",
    historia: "Da Antiguidade aos dias de hoje, com olhar humanista.",
    ciencias: "Investigação, curiosidade e cuidado com a criação.",
    geografia: "O mundo, o Brasil e o lugar onde vivemos.",
  };

  let catalog = null;
  let viewer = null; // instância ativa do visor

  // ---------------------------------------------------------- utilidades
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const tpl = (id) => document.getElementById(id).content.cloneNode(true);
  const slot = (root, name) => root.querySelector(`[data-slot="${name}"]`);
  const ordinal = (n) => (n <= 9 ? `${n}º ano` : `${n - 9}ª série EM`);   // 10…12 = Ensino Médio

  let toastTimer;
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove("show"), 2200);
  }

  function setCrumbs(items) {
    $crumbs.innerHTML = items
      .map((it, i) => {
        const last = i === items.length - 1;
        const el = it.href && !last ? `<a href="${it.href}">${esc(it.label)}</a>` : `<span class="${last ? "current" : ""}">${esc(it.label)}</span>`;
        return (i ? '<span class="chev">›</span>' : "") + el;
      })
      .join("");
  }

  function materiaBySlug(slug) { return catalog.materias.find((m) => m.slug === slug); }
  function livroBySlug(slug) { return catalog.livros.find((l) => l.slug === slug); }

  // ---------------------------------------------------------- páginas
  function renderHome() {
    document.title = "Amostras – Solar Colégios";
    setCrumbs([{ label: "Matérias" }]);
    const view = tpl("tpl-home");
    slot(view, "materias").innerHTML = catalog.materias
      .map((m) => {
        const vazio = m.livros === 0;
        return `<a class="card-materia ${vazio ? "vazio" : ""}" href="#/m/${m.slug}" style="--cor:${m.cor}">
            <h2>${esc(m.nome)}</h2>
            <span>${vazio ? "Em breve" : m.livros === 1 ? "1 amostra" : m.livros + " amostras"}</span>
          </a>`;
      })
      .join("");
    mount(view);
  }

  function renderMateria(slug) {
    const m = materiaBySlug(slug);
    if (!m) return renderNotFound();
    document.title = `${m.nome} – Amostras Solar Colégios`;
    setCrumbs([{ label: "Matérias", href: "#/" }, { label: m.nome }]);

    const view = tpl("tpl-materia");
    slot(view, "pill").textContent = "Coleção Didática";
    slot(view, "voltar-topo").href = "#/";
    slot(view, "nome").textContent = m.nome;
    slot(view, "desc").textContent = DESCRICOES[slug] || "";

    const livros = catalog.livros.filter((l) => l.materia === slug);
    const $anos = slot(view, "anos");
    if (!livros.length) {
      $anos.innerHTML = `<div class="empty">Ainda não há amostras de ${esc(m.nome)}. Em breve.</div>`;
    } else {
      const anos = [...new Set(livros.map((l) => l.ano))].sort((a, b) => a - b);
      $anos.innerHTML = anos
        .map((ano) => {
          const cards = livros
            .filter((l) => l.ano === ano)
            .map(
              (l) => `<a class="card-livro" href="#/l/${l.slug}">
                <div class="capa"><img src="livros/${l.slug}/capa.webp" alt="Capa – ${esc(l.titulo)}" loading="lazy"></div>
                <span class="tag ${l.publico}">${esc(l.publicoNome)}</span>
                <strong>${esc(l.titulo)}</strong>
                <small>${l.paginas} páginas de amostra</small>
              </a>`
            )
            .join("");
          return `<div class="ano-bloco"><h2>${ordinal(ano)}</h2><div class="grid grid-livros">${cards}</div></div>`;
        })
        .join("") + `<div class="voltar-rodape"><a class="btn btn-primary" href="#/">Voltar às matérias</a></div>`;
    }
    mount(view);
  }

  function renderNotFound() {
    setCrumbs([{ label: "Matérias", href: "#/" }, { label: "Não encontrado" }]);
    const div = document.createElement("div");
    div.className = "empty";
    div.innerHTML = `Página não encontrada. <a href="#/" style="color:var(--brand-primary);font-weight:700">Voltar às matérias</a>`;
    mount(div);
  }

  function mount(node) {
    if (viewer) { viewer.destroy(); viewer = null; }
    $app.replaceChildren(node);
    window.scrollTo({ top: 0 });
  }

  // ---------------------------------------------------------- visor
  function renderLivro(slug, startPage) {
    const l = livroBySlug(slug);
    if (!l) return renderNotFound();
    const m = materiaBySlug(l.materia);
    document.title = `${l.titulo} (${l.publicoNome}) – Amostras Solar Colégios`;
    setCrumbs([{ label: "Matérias", href: "#/" }, { label: m.nome, href: `#/m/${m.slug}` }, { label: `${ordinal(l.ano)} · ${l.publicoNome}` }]);

    const view = tpl("tpl-viewer");
    slot(view, "overline").textContent = m.nome;
    slot(view, "titulo").textContent = l.titulo;
    slot(view, "subtitulo").textContent = `${l.subtitulo} · ${l.paginas} páginas de amostra`;
    const voltar = slot(view, "voltar");
    voltar.href = `#/m/${m.slug}`;
    voltar.textContent = `← Todos os livros de ${m.nome}`;
    slot(view, "info").innerHTML = `
      <span>Clique nas laterais, arraste a página ou use as setas para folhear</span>
      <span><kbd>←</kbd> <kbd>→</kbd> navegar</span>
      <span><kbd>F</kbd> ou duplo clique: tela cheia</span>
      <span><kbd>Ctrl</kbd> + roda do mouse: ampliar · <kbd>0</kbd> volta a 100%</span>`;
    if (l.pdf) {
      const dl = slot(view, "download");
      dl.href = `livros/${l.slug}/${l.pdf}`;
      dl.hidden = false;
    }
    mount(view);
    viewer = new Viewer(l, $app.querySelector('[data-slot="viewer"]'), startPage);
  }

  const VIRADA_MS = 750;
  const sorteio = (a, b) => a + Math.random() * (b - a);
  const CHAVE_DICA = "amostras.dica-vista";

  class Viewer {
    constructor(livro, root, startPage) {
      this.l = livro;
      this.root = root;
      this.stage = slot(root, "stage");
      this.wrap = slot(root, "bookwrap");
      this.bookEl = slot(root, "book");
      this.loadingEl = slot(root, "loading");
      this.counterEl = slot(root, "counter");
      this.thumbsEl = slot(root, "thumbs");
      this.ratio = livro.ratio || 1.4;
      this.n = livro.paginas;

      this.pages = Array.from({ length: this.n }, (_, i) => `livros/${livro.slug}/pages/p${String(i + 1).padStart(3, "0")}.webp`);
      this.thumbs = Array.from({ length: this.n }, (_, i) => `livros/${livro.slug}/pages/t${String(i + 1).padStart(3, "0")}.webp`);
      this.hires = Array.from({ length: this.n }, (_, i) => `livros/${livro.slug}/pages/h${String(i + 1).padStart(3, "0")}.webp`);
      this.hiresLoaded = new Set();

      this.onKey = this.onKey.bind(this);
      this.onResize = this.onResize.bind(this);
      this.onFsChange = this.onFsChange.bind(this);

      this.zoomBadge = slot(root, "zoombadge");
      this.zoomLabel = slot(root, "zoomlabel");
      this.zoom = { z: 1, tx: 0, ty: 0 };

      this.ajustarAltura(true);
      this.initFlip(startPage);
      this.bind();
      this.mostrarDica();
      this.onScroll = () => this.marcarBarra();
      window.addEventListener("scroll", this.onScroll, { passive: true });
      this.marcarBarra();
      this.bindZoom();
      this.preload();

      const first = new Image();
      first.onload = first.onerror = () => this.loadingEl.classList.add("hide");
      first.src = this.pages[0];
      setTimeout(() => this.loadingEl.classList.add("hide"), 4000);
    }

    /**
     * No celular a barra do navegador aparece e some ao rolar e muda a altura da janela
     * (e o 100dvh); isso não deve redimensionar o livro. Lá a altura do palco é fixada
     * em pixels e só recalculada quando a largura muda (girar o aparelho). No computador
     * vale a altura do CSS.
     */
    ajustarAltura(forcar) {
      if (!this.toque) { this.stage.style.removeProperty("--altura-palco"); return true; }
      const largura = window.innerWidth;
      if (!forcar && largura === this._largura) return false;
      this._largura = largura;
      const h = largura <= 720 ? Math.max(380, window.innerHeight - 160) : Math.max(420, Math.min(window.innerHeight * 0.78, 820));
      this.stage.style.setProperty("--altura-palco", `${Math.round(h)}px`);
      return true;
    }

    /** a barra de botões está grudada no pé da tela (sobre as páginas)? fundo mais escuro */
    marcarBarra() {
      const barra = slot(this.root, "toolbar"), palco = this.stage.getBoundingClientRect();
      barra.classList.toggle("solta", palco.bottom > window.innerHeight + 1 && palco.top < window.innerHeight);
    }
    get toque() { return window.matchMedia("(pointer: coarse)").matches; }

    /** livro aberto no desktop, página única em telas estreitas */
    wantPortrait() { return this.stage.clientWidth < 640; }

    /** dimensiona o elemento do livro para caber na área disponível */
    fitBook() {
      const cs = getComputedStyle(this.wrap);
      const availW = this.wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const availH = this.wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const across = this.portraitMode ? 1 : 2;
      const W = Math.max(120, Math.floor(Math.min(availW, (availH / this.ratio) * across)));
      this.bookW = W;
      this.bookEl.style.width = W + "px";
      this.bookEl.style.height = Math.floor((W / across) * this.ratio) + "px";
    }

    /**
     * No livro aberto, a capa aparece sozinha na metade direita e a contracapa (quando o
     * nº de páginas é par) na metade esquerda: desloca o livro meia página para
     * centralizá-las, ao mesmo tempo que a página vira.
     */
    centralizar(alvo, animar = true) {
      let d = 0;
      if (!this.portraitMode) {
        if (alvo <= 0) d = -25;
        else if (this.n % 2 === 0 && alvo >= this.n - 1) d = 25;
      }
      const ms = this.variacao ? this.variacao.ms : VIRADA_MS;
      this.bookEl.style.transition = animar ? `translate ${ms}ms cubic-bezier(.45,.05,.25,1)` : "none";
      this.bookEl.style.translate = `${d}% 0`;
    }

    initFlip(startPage) {
      this.portraitMode = this.wantPortrait();
      this.fitBook();
      const baseW = 500;
      this.flip = new St.PageFlip(this.bookEl, {
        width: baseW,
        height: Math.round(baseW * this.ratio),
        size: "stretch",
        // no modo retrato, minWidth > largura do bloco força o page-flip a mostrar 1 página
        minWidth: this.portraitMode ? this.bookW + 1 : 60,
        maxWidth: 1400,
        minHeight: 80,
        maxHeight: 2000,
        showCover: true,
        usePortrait: this.portraitMode,
        autoSize: false,
        drawShadow: true,
        maxShadowOpacity: 0.45,
        flippingTime: VIRADA_MS,
        mobileScrollSupport: false,
        swipeDistance: 20,
        showPageCorners: false,     // sem a dobra ao aproximar o cursor da borda
        disableFlipByClick: false,  // (o clique é filtrado abaixo; ver blockClickFlip)
        startPage: Math.max(0, Math.min((startPage || 1) - 1, this.n - 1)),
      });

      const frag = document.createDocumentFragment();
      this.pages.forEach((src, i) => {
        const div = document.createElement("div");
        div.className = "page";
        if (i === 0 || i === this.n - 1) div.dataset.density = "hard";
        const img = document.createElement("img");
        img.src = src;
        img.dataset.page = String(i); img.alt = `Página ${i + 1}`; img.draggable = false;
        if (i > 3) img.loading = "lazy";
        div.appendChild(img); frag.appendChild(div);
      });
      this.bookEl.appendChild(frag);
      this.flip.loadFromHTML(this.bookEl.querySelectorAll(".page"));
      this.blockClickFlip();
      this.flip.on("flip", () => { this.centralizar(this.index); this.sync(); });
      this.flip.on("changeOrientation", () => this.sync());
      this.flip.on("init", () => this.sync());
      this.centralizar(this.flip.getCurrentPageIndex(), false);
      this.sync();
    }

    /**
     * O page-flip vira a página em qualquer clique simples sobre o livro. Aqui o clique
     * é tratado pelas zonas laterais (25%), então só deixamos passar as viradas
     * programáticas (setas, teclado, miniaturas); o arrasto continua funcionando.
     */
    blockClickFlip() {
      const fc = this.flip.flipController;
      if (!fc || fc.__patched) return;
      fc.flip = (pos) => { if (fc.__allow) return this.virar(fc, pos); };
      for (const name of ["flipNext", "flipPrev"]) {
        const orig = fc[name].bind(fc);
        fc[name] = (corner) => { fc.__allow = true; try { return orig(corner); } finally { fc.__allow = false; } };
      }
      fc.__patched = true;
    }

    /**
     * Sorteia pequenas variações para a próxima virada (canto de onde a página sai,
     * altura da dobra, curva do trajeto, ritmo e duração), para ela não ser sempre igual.
     */
    sortearVariacao() {
      this.variacao = {
        canto: Math.random() < 0.6 ? "bottom" : "top",
        ms: Math.round(VIRADA_MS * sorteio(0.88, 1.14)),
        dobra: sorteio(0.6, 1.5),   // quanto o canto já sai levantado (× 1/10 da altura)
        recuo: sorteio(0.7, 1.35),  // quanto o canto sai para dentro da página
        curva: sorteio(0.03, 0.15), // arco do trajeto do canto (× altura)
        fim: sorteio(0, 0.06),      // o canto termina um pouco acima/abaixo da borda
        ritmo: sorteio(1.35, 1.9),  // aceleração no começo e freada no fim
      };
      return this.variacao;
    }

    /**
     * Substitui a virada do page-flip (trajeto reto e ritmo constante) por um trajeto
     * curvo com aceleração e freada, com as variações sorteadas. No modo de uma página,
     * voltar é a virada para a frente tocada ao contrário: a página anterior volta por
     * cima da atual, dobrando, em vez de deslizar de lado.
     */
    virar(fc, pos) {
      const v = this.variacao || this.sortearVariacao();
      this.variacao = null;
      if (fc.calc !== null) fc.render.finishAnimation();
      if (!fc.start(pos)) return;
      const r = fc.getBoundsRect(), w = r.pageWidth, h = r.height;
      let baixo = fc.calc.getCorner() === "bottom";
      const borda = baixo ? h : 0, sinal = baixo ? -1 : 1; // sinal: para dentro da página
      const lift = (h / 10) * v.dobra;
      const levantado = { x: w - lift * v.recuo, y: borda + sinal * lift };
      const virado = { x: -w, y: borda + sinal * h * v.fim };
      const arco = sinal * h * v.curva * (baixo ? 1 : 0.6);

      const voltarRetrato = fc.render.getOrientation() === "portrait" && fc.calc.getDirection() === 1;
      if (voltarRetrato) {
        // mostra a página anterior e a "desvira": o canto vai de virado até assentar
        const pc = this.flip.getPageCollection();
        fc.reset();
        pc.setCurrentSpreadIndex(pc.getCurrentSpreadIndex() - 1);
        pc.showSpread();
        const rr = fc.render.getRect();
        if (!fc.start({ x: rr.left + 2 * rr.pageWidth - 10, y: baixo ? rr.height - 2 : 1 })) return;
      }
      fc.setState("flipping");
      const [a, b] = voltarRetrato ? [virado, { x: w, y: borda }] : [levantado, virado];
      const pontos = this.trajeto(a, b, arco, v.ritmo, Math.max(40, Math.round(v.ms / 8)));
      fc.calc.calc(pontos[0]);
      fc.render.startAnimation(pontos.map((p) => () => fc.do(p)), v.ms, () => {
        if (!fc.calc) return;
        if (!voltarRetrato) fc.calc.getDirection() === 1 ? fc.app.turnToPrevPage() : fc.app.turnToNextPage();
        fc.render.setBottomPage(null);
        fc.render.setFlippingPage(null);
        fc.render.clearShadow();
        fc.setState("read");
        fc.reset();
      });
    }

    /** pontos de a até b numa curva (arco em y no meio), com ritmo suave nas pontas */
    trajeto(a, b, arco, ritmo, n) {
      const ease = (t) => (t < 0.5 ? Math.pow(2 * t, ritmo) / 2 : 1 - Math.pow(2 * (1 - t), ritmo) / 2);
      const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + 2 * arco };
      const pts = [];
      for (let k = 0; k <= n; k++) {
        const t = ease(k / n), u = 1 - t;
        pts.push({ x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y });
      }
      return pts;
    }

    /** recria o livro ao trocar entre 1 e 2 páginas (girar o celular, redimensionar) */
    rebuild() {
      const page = this.index;
      try { this.flip.destroy(); } catch {} // o page-flip remove o elemento .book
      if (this.bookEl.parentElement) this.bookEl.remove();
      const el = document.createElement("div");
      el.className = "book"; el.dataset.slot = "book";
      this.wrap.insertBefore(el, this.loadingEl);
      this.bookEl = el;
      this.initFlip(page + 1);
      if (this.thumbsEl.childElementCount) this.renderThumbs();
      this.hiresLoaded.clear();
      this.applyZoom();
    }
    refresh() {
      if (this.wantPortrait() !== this.portraitMode) return this.rebuild();
      this.fitBook(); this.flip.update(); this.sync();
      this.setZoom(this.zoom.z, this.zoom.tx, this.zoom.ty); // reaplica limites
    }

    get index() { return this.flip.getCurrentPageIndex(); }
    get portrait() { return this.flip.getOrientation() === "portrait"; }

    /** índices (0-based) das páginas visíveis */
    visible() {
      const i = this.index, n = this.n;
      if (this.portrait) return [i];
      if (i === 0) return [0];
      if (i >= n - 1 && n % 2 === 0) return [n - 1];
      const left = i % 2 === 1 ? i : i - 1;
      return left + 1 < n ? [left, left + 1] : [left];
    }
    get canPrev() { return this.index > 0; }
    get canNext() { const v = this.visible(); return v[v.length - 1] < this.n - 1; }

    sync() {
      this.blockClickFlip(); // o page-flip pode recriar o controlador ao atualizar
      if (this.zoom && this.zoom.z > 1.15) this.loadHires();
      const v = this.visible();
      this.counterEl.textContent = (v.length === 2 ? `${v[0] + 1}–${v[1] + 1}` : `${v[0] + 1}`) + ` / ${this.n}`;
      this.root.querySelectorAll('[data-action="prev"],[data-action="first"]').forEach((b) => (b.disabled = !this.canPrev));
      this.root.querySelectorAll('[data-action="next"],[data-action="last"]').forEach((b) => (b.disabled = !this.canNext));
      if (this.limparZonas && (!this.canPrev || !this.canNext)) this.limparZonas();
      this.thumbsEl.querySelectorAll("button").forEach((b) =>
        b.classList.toggle("active", b.dataset.grupo.split(",").some((p) => v.includes(+p))));
      const active = this.thumbsEl.querySelector("button.active");
      if (active && !this.thumbsEl.hidden) active.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      const hash = `#/l/${this.l.slug}/${this.index + 1}`;
      if (location.hash !== hash) history.replaceState(null, "", hash);
    }

    goTo(i) {
      i = Math.max(0, Math.min(i, this.n - 1));
      if (i === this.index) return;
      const { canto } = this.sortearVariacao();
      this.centralizar(i);
      this.flip.flip(i, canto);
    }
    next() {
      if (!this.canNext) return;
      const v = this.visible(), { canto } = this.sortearVariacao();
      this.centralizar(v[v.length - 1] + 1);
      this.flip.flipNext(canto);
    }
    prev() {
      if (!this.canPrev) return;
      const { canto } = this.sortearVariacao();
      this.centralizar(this.visible()[0] - 1);
      this.flip.flipPrev(canto);
    }

    preload() {
      let i = 0;
      const load = () => {
        if (i >= this.pages.length) return;
        const img = new Image();
        img.onload = img.onerror = () => { i++; setTimeout(load, 30); };
        img.src = this.pages[i];
      };
      load();
    }

    // ---------------------------------------------------- eventos
    bind() {
      this.root.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (btn) this.action(btn.dataset.action, btn);
      });

      // clique nos 25% laterais da área do livro = página anterior / próxima
      // (um arrasto do page-flip não conta como clique)
      const zoneClick = (clientX) => {
        if (this.zoom.z > 1.01) return; // com zoom, o clique/arrasto serve para mover a página
        const r = this.stage.getBoundingClientRect();
        const x = (clientX - r.left) / r.width;
        if (x <= 0.25) this.prev();
        else if (x >= 0.75) this.next();
      };
      let down = null;
      this.wrap.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: Date.now(), type: e.pointerType }; }, true);
      this.wrap.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        if (!down || down.type === "touch") return; // toque é tratado abaixo
        if (Math.abs(e.clientX - down.x) > 6 || Math.abs(e.clientY - down.y) > 6) return;
        zoneClick(e.clientX);
      });

      // toque (celular): deslizar para o lado muda de página; toque curto nas laterais também.
      // Os eventos de toque não chegam ao page-flip para não haver dupla interpretação.
      ["touchstart", "touchmove", "touchend"].forEach((t) => this.wrap.addEventListener(t, (e) => e.stopPropagation(), true));
      this.wrap.addEventListener("pointerup", (e) => {
        if (!down || e.pointerType !== "touch") return;
        if (this.zoom.z > 1.01 || this._pinching) { down = null; return; }
        const dx = e.clientX - down.x, dy = e.clientY - down.y;
        const fast = Date.now() - down.t < 300;
        if (Math.abs(dx) > (fast ? 30 : 70) && Math.abs(dx) > Math.abs(dy)) {
          dx < 0 ? this.next() : this.prev();
        } else if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && !e.target.closest("button")) {
          zoneClick(e.clientX);
        }
        down = null;
      });
      // o navegador assumiu o gesto (rolagem vertical da tela): não é toque nem deslize
      this.wrap.addEventListener("pointercancel", () => { down = null; });
      this.wrap.addEventListener("dblclick", (e) => {
        if (e.target.closest("button")) return;
        e.preventDefault();
        this.toggleFullscreen();
      });

      // com o mouse sobre uma área clicável (25% de cada lado), ela e a seta se destacam
      const zonas = { prev: this.wrap.querySelector(".zona.prev"), next: this.wrap.querySelector(".zona.next") };
      const setas = { prev: this.root.querySelector(".side-arrow.prev"), next: this.root.querySelector(".side-arrow.next") };
      const destacar = (lado) => {
        for (const k of ["prev", "next"]) {
          zonas[k].classList.toggle("ativa", k === lado);
          setas[k].classList.toggle("na-zona", k === lado);
        }
      };
      this.stage.addEventListener("mousemove", (e) => {
        if (this.toque) return;           // toque também gera "mousemove": só com mouse
        if (this.zoom.z > 1.01 || !(e.target.closest(".book-wrap") || e.target.closest(".side-arrow"))) return destacar(null);
        const r = this.stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
        destacar(x <= 0.25 && this.canPrev ? "prev" : x >= 0.75 && this.canNext ? "next" : null);
      });
      this.stage.addEventListener("mouseleave", () => destacar(null));
      this.limparZonas = () => destacar(null);

      document.addEventListener("keydown", this.onKey);
      window.addEventListener("resize", this.onResize);
      document.addEventListener("fullscreenchange", this.onFsChange);
      document.addEventListener("webkitfullscreenchange", this.onFsChange);
    }

    action(name, btn) {
      switch (name) {
        case "prev": this.prev(); break;
        case "next": this.next(); break;
        case "first": this.goTo(0); break;
        case "last": this.goTo(this.n - 1); break;
        case "thumbs": this.toggleThumbs(btn); break;
        case "fullscreen": this.toggleFullscreen(); break;
        case "zoom-reset": this.resetZoom(); break;
        case "goto": this.goTo(+btn.dataset.page); break;
      }
    }

    onKey(e) {
      if (e.target.matches("input,textarea")) return;
      switch (e.key) {
        case "ArrowLeft": case "PageUp": e.preventDefault(); this.prev(); break;
        case "ArrowRight": case "PageDown": case " ": e.preventDefault(); this.next(); break;
        case "Home": this.goTo(0); break;
        case "End": this.goTo(this.n - 1); break;
        case "Escape": if (this.zoom.z > 1) this.resetZoom(); else if (this.isFullscreen()) this.toggleFullscreen(); break;
        case "0": this.resetZoom(); break;
        case "f": case "F": this.toggleFullscreen(); break;
      }
    }

    onResize() {
      clearTimeout(this._rt);
      this._rt = setTimeout(() => {
        if (this.isFullscreen()) return this.refresh();
        // no celular, mudança só de altura (barra do navegador) não mexe no livro
        if (this.ajustarAltura(false) || !this.toque) this.refresh();
        this.marcarBarra();
      }, 120);
    }

    // ---------------------------------------------------- zoom (roda do mouse / dois dedos)
    bindZoom() {
      const W = this.wrap;
      // Ctrl + roda do mouse (ou pinça no touchpad, que chega assim): amplia em torno do
      // cursor; a roda sozinha rola a tela normalmente, mesmo sobre o livro
      W.addEventListener("wheel", (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015));
        this.zoomAt(this.zoom.z * factor, e.clientX, e.clientY);
      }, { passive: false });

      // pinça com dois dedos + arrastar para mover quando ampliado
      const pts = new Map();
      let pinch = null, pan = null;
      W.addEventListener("pointerdown", (e) => {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 2) {
          const [a, b] = [...pts.values()];
          pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.zoom.z, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
          pan = null; this._pinching = true;
        } else if (pts.size === 1 && this.zoom.z > 1.01) {
          pan = { x: e.clientX, y: e.clientY, tx: this.zoom.tx, ty: this.zoom.ty };
          W.classList.add("panning");
        }
      }, true);
      W.addEventListener("pointermove", (e) => {
        if (!pts.has(e.pointerId)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && pts.size === 2) {
          const [a, b] = [...pts.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          this.zoomAt(pinch.z * (d / pinch.d), (a.x + b.x) / 2, (a.y + b.y) / 2);
        } else if (pan) {
          this.setZoom(this.zoom.z, pan.tx + (e.clientX - pan.x), pan.ty + (e.clientY - pan.y));
        }
      }, true);
      const up = (e) => {
        pts.delete(e.pointerId);
        if (pts.size < 2) pinch = null;
        if (pts.size === 0) { pan = null; W.classList.remove("panning"); setTimeout(() => (this._pinching = false), 50); }
      };
      W.addEventListener("pointerup", up, true);
      W.addEventListener("pointercancel", up, true);

      // com zoom, o page-flip não recebe o mouse (o arrasto vira "mover")
      ["mousedown", "touchstart"].forEach((t) => W.addEventListener(t, (e) => {
        if (this.zoom.z > 1.01 || pts.size >= 2) e.stopPropagation();
      }, true));
    }

    /** amplia/reduz mantendo o ponto (cx, cy) da tela parado */
    zoomAt(z, cx, cy) {
      z = Math.max(1, Math.min(4, z));
      const r = this.bookEl.getBoundingClientRect();
      // centro atual do livro na tela
      const bx = r.left + r.width / 2, by = r.top + r.height / 2;
      const k = z / this.zoom.z;
      const tx = this.zoom.tx + (bx - cx) * (k - 1);
      const ty = this.zoom.ty + (by - cy) * (k - 1);
      this.setZoom(z, tx, ty);
    }

    setZoom(z, tx, ty) {
      z = Math.max(1, Math.min(4, Math.round(z * 1000) / 1000));
      if (z <= 1.001) { z = 1; tx = 0; ty = 0; }
      else {
        // não deixa a página sair inteira da área visível
        const bw = this.bookEl.offsetWidth, bh = this.bookEl.offsetHeight;
        const ww = this.wrap.clientWidth, wh = this.wrap.clientHeight;
        const mx = Math.max(0, (bw * z - ww) / 2 + 40), my = Math.max(0, (bh * z - wh) / 2 + 40);
        tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty));
      }
      this.zoom = { z, tx, ty };
      this.applyZoom();
    }

    /** com zoom, troca as páginas visíveis (e vizinhas) pela versão em alta resolução */
    loadHires() {
      const v = this.visible();
      const wanted = new Set(v);
      v.forEach((i) => { wanted.add(i - 1); wanted.add(i - 2); wanted.add(i + 1); wanted.add(i + 2); });
      wanted.forEach((i) => {
        if (i < 0 || i >= this.n || this.hiresLoaded.has(i)) return;
        this.hiresLoaded.add(i);
        const pre = new Image();
        pre.onload = () => this.bookEl.querySelectorAll(`img[data-page="${i}"]`).forEach((img) => (img.src = this.hires[i]));
        pre.onerror = () => this.hiresLoaded.delete(i); // sem versão em alta: mantém a normal
        pre.src = this.hires[i];
      });
    }

    applyZoom() {
      const { z, tx, ty } = this.zoom;
      if (z > 1.15) this.loadHires();
      this.bookEl.style.transformOrigin = "center center";
      this.bookEl.style.transform = z === 1 ? "" : `translate(${tx}px, ${ty}px) scale(${z})`;
      this.wrap.classList.toggle("zoomed", z > 1);
      this.zoomBadge.hidden = z <= 1;
      this.zoomLabel.textContent = `${Math.round(z * 100)}%`;
    }
    resetZoom() { this.setZoom(1, 0, 0); }

    // ---------------------------------------------------- miniaturas
    /** páginas vistas juntas: capa sozinha, depois pares (2–3, 4–5…); com uma página por vez, todas separadas */
    grupos() {
      if (this.portraitMode) return this.thumbs.map((_, i) => [i]);
      const g = [[0]];
      for (let i = 1; i < this.n; i += 2) g.push(i + 1 < this.n ? [i, i + 1] : [i]);
      return g;
    }
    renderThumbs() {
      this.thumbsEl.innerHTML = this.grupos()
        .map((g) => {
          const rot = g.map((i) => i + 1).join("–");
          const imgs = g.map((i) => `<img src="${this.thumbs[i]}" alt="" loading="lazy">`).join("");
          return `<button data-action="goto" data-page="${g[0]}" data-grupo="${g.join(",")}" aria-label="Página ${rot}"><span class="par">${imgs}</span><span class="num">${rot}</span></button>`;
        })
        .join("");
      this.sync();
    }
    toggleThumbs(btn) {
      const show = this.thumbsEl.hidden;
      if (show && !this.thumbsEl.childElementCount) this.renderThumbs();
      this.thumbsEl.hidden = !show;
      btn.setAttribute("aria-pressed", String(show));
      setTimeout(() => this.refresh(), 20);
    }

    // ---------------------------------------------------- dica (só na primeira visita)
    mostrarDica() {
      let vista = false;
      try { vista = !!localStorage.getItem(CHAVE_DICA); } catch {}
      if (vista) return;
      const el = slot(this.root, "dica");
      const folhear = this.toque
        ? "Deslize para o lado ou toque nas bordas do livro para virar a página; com dois dedos, amplie."
        : "Clique nas bordas do livro, arraste a página ou use as setas ← → do teclado; Ctrl + roda do mouse amplia.";
      const ic = (d) => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
      el.innerHTML = `
        <button class="dica-fechar" data-fechar aria-label="Fechar">×</button>
        <strong>Como folhear</strong>
        <p>${folhear}</p>
        <ul>
          <li>${ic("M18 6l-6 6 6 6M11 6l-6 6 6 6")}${ic("M6 6l6 6-6 6M13 6l6 6-6 6")}<span>primeira e última página</span></li>
          <li>${ic("M15 6l-6 6 6 6")}${ic("M9 6l6 6-6 6")}<span>página anterior e próxima</span></li>
          <li><svg viewBox="0 0 24 24"><rect x="3" y="4" width="7" height="7" rx="2"/><rect x="14" y="4" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg><span>miniaturas de todas as páginas</span></li>
          <li>${ic("M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5")}<span>tela cheia (ou ${this.toque ? "toque duas vezes" : "dê dois cliques"} no livro)</span></li>
        </ul>
        <button class="btn btn-secondary btn-sm" data-fechar>Entendi</button>`;
      el.hidden = false;
      el.addEventListener("click", (e) => {
        if (!e.target.closest("[data-fechar]")) return;
        el.hidden = true;
        try { localStorage.setItem(CHAVE_DICA, "1"); } catch {}
      });
    }

    // ---------------------------------------------------- tela cheia
    isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement) || this.stage.classList.contains("is-fullscreen"); }
    toggleFullscreen() {
      const el = this.stage;
      if (this.isFullscreen()) {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (document.webkitFullscreenElement) document.webkitExitFullscreen();
        el.classList.remove("is-fullscreen");
      } else if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => el.classList.add("is-fullscreen"));
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else {
        el.classList.add("is-fullscreen"); // iPhone: simulado
      }
      this.onFsChange();
    }
    onFsChange() {
      const icon = this.root.querySelector('[data-action="fullscreen"] svg path');
      if (icon) icon.setAttribute("d", this.isFullscreen() ? "M9 4v5H4M15 4v5h5M20 15h-5v5M4 15h5v5" : "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5");
      setTimeout(() => this.refresh(), 150);
    }

    destroy() {
      document.removeEventListener("keydown", this.onKey);
      window.removeEventListener("resize", this.onResize);
      window.removeEventListener("scroll", this.onScroll);
      document.removeEventListener("fullscreenchange", this.onFsChange);
      document.removeEventListener("webkitfullscreenchange", this.onFsChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      try { this.flip.destroy(); } catch {}
    }
  }

  // ---------------------------------------------------------- roteador
  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (!parts.length) return renderHome();
    if (parts[0] === "m" && parts[1]) return renderMateria(parts[1]);
    if (parts[0] === "l" && parts[1]) {
      // mesmo livro, só mudou a página (replaceState) → não recria
      if (viewer && viewer.l.slug === parts[1]) return;
      return renderLivro(parts[1], parseInt(parts[2], 10) || 1);
    }
    renderNotFound();
  }

  fetch("catalog.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => { catalog = data; route(); window.addEventListener("hashchange", route); })
    .catch((err) => {
      $app.innerHTML = `<div class="empty">Não foi possível carregar o catálogo (<code>catalog.json</code>).<br>Rode <code>python build.py</code> e publique a pasta <code>site/</code>.<br><small>${esc(err.message)}</small></div>`;
    });
})();

