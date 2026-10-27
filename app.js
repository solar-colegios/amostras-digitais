/* ============================================================
   Solar Colégios – Amostras  |  app.js
   Só o que é das Amostras: o catálogo publicado (catalog.json, gerado pelo build.py), os
   endereços das imagens e as frases. O catálogo e o visor ficam no livros.js, arquivo
   comum com os Livros do Professor da Plataforma Solar (não editar um sem o outro).
   ============================================================ */
(() => {
  "use strict";

  const DESCRICOES = {
    religiao: "Formação religiosa e valores para cada etapa da vida escolar.",
    "quero-querer": "Educação do caráter e da afetividade.",
    historia: "Da Antiguidade aos dias de hoje, com olhar humanista.",
    ciencias: "Investigação, curiosidade e cuidado com a criação.",
    geografia: "O mundo, o Brasil e o lugar onde vivemos.",
    "cadernos-historico-geograficos": "Uma proposta integrada que conecta História e Geografia a partir de literatura e arte.",
    "matematica-cingapura": "O método de Matemática usado em Cingapura, adaptado às exigências do programa oficial.",
  };
  const n3 = (i) => String(i + 1).padStart(3, "0");

  SolarLivros.iniciar({
    async catalogo() {
      const r = await fetch("catalog.json", { cache: "no-cache" });
      if (!r.ok) throw new Error(r.status);
      const c = await r.json();
      for (const m of c.materias) m.descricao = DESCRICOES[m.slug] || "";
      return c;
    },
    capa: (l) => `livros/${l.slug}/capa.webp`,
    imagens: (l) => ({
      pagina: (i) => `livros/${l.slug}/pages/p${n3(i)}.webp`,
      miniatura: (i) => `livros/${l.slug}/pages/t${n3(i)}.webp`,
      zoom: (i) => `livros/${l.slug}/pages/h${n3(i)}.webp`,
      pdf: l.pdf ? `livros/${l.slug}/${l.pdf}` : null,
    }),
    chaveDica: "amostras.dica-vista",
    mostrarMateriasVazias: true,
    textos: {
      site: "Amostras Solar Colégios",
      inicio: "Amostras – Solar Colégios",
      heroOverline: "Coleções Didáticas",
      heroTitulo: "Amostras dos livros",
      heroTexto: "Escolha uma matéria para folhear amostras dos livros do aluno, do professor, dos pais e de exercícios, e dos recursos didáticos.",
      carregando: "Carregando amostra…",
      contagem: (n) => (n === 1 ? "1 amostra" : `${n} amostras`),
      paginas: (n) => `${n} páginas de amostra`,
      materiaVazia: (nome) => `Ainda não há amostras de ${nome}. Em breve.`,
      erroCatalogo: "Não foi possível carregar o catálogo (catalog.json). Rode python build.py e publique a pasta site/.",
    },
  });
})();
