// Gera slug de strings em português (remove acentos, lowercase, hifeniza)
export function slugify(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove acentos
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove caracteres especiais
        .trim()
        .replace(/\s+/g, '-') // espaços → hifens
        .replace(/-+/g, '-'); // hifens múltiplos → um
}
//# sourceMappingURL=slugify.js.map