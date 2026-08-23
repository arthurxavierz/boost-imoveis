// Dados de exemplo da Boost. Alimentam o modo demonstracao e o seed.sql.
// As chaves seguem os nomes das colunas do banco.

// ---------- USUARIOS ----------
// papel: 'admin' (gestao total) ou 'consultor'.
// permissoes: o admin liga e desliga por usuario na aba Usuarios.
export const mockUsuarios = [
  { id: 'u1', nome: 'Diego Martins', email: 'diego@boostimoveis.com.br', papel: 'admin', iniciais: 'DM', telefone: '(34) 99911-0001', ativo: true, permissoes: { imoveis: true, leads: true, financeiro: true, usuarios: true }, criado_em: '2025-01-10' },
  { id: 'u2', nome: 'Marina Rezende', email: 'marina@boostimoveis.com.br', papel: 'consultor', iniciais: 'MR', telefone: '(34) 99911-0002', ativo: true, permissoes: { imoveis: true, leads: true, financeiro: false, usuarios: false }, criado_em: '2025-02-04' },
  { id: 'u3', nome: 'Thiago Galassi', email: 'thiago@boostimoveis.com.br', papel: 'consultor', iniciais: 'TG', telefone: '(34) 99911-0003', ativo: true, permissoes: { imoveis: true, leads: true, financeiro: false, usuarios: false }, criado_em: '2025-02-18' },
  { id: 'u4', nome: 'Camila Andrade', email: 'camila@boostimoveis.com.br', papel: 'consultor', iniciais: 'CA', telefone: '(34) 99911-0004', ativo: true, permissoes: { imoveis: true, leads: true, financeiro: false, usuarios: false }, criado_em: '2025-03-09' },
  { id: 'u5', nome: 'Rafael Boaventura', email: 'rafael@boostimoveis.com.br', papel: 'consultor', iniciais: 'RB', telefone: '(34) 99911-0005', ativo: true, permissoes: { imoveis: true, leads: true, financeiro: false, usuarios: false }, criado_em: '2025-04-22' }
];

// ---------- IMOVEIS ----------
// corretor_id define o dono. So o dono ou o admin edita e exclui.
// fotos guarda imagens da galeria (data URLs no modo demonstracao).
export const mockImoveis = [
  { id: 1, titulo: 'Cobertura Duplex Morada da Colina', tipo: 'Cobertura', finalidade: 'Venda', bairro: 'Morada da Colina', cidade: 'Uberlandia', valor: 2850000, status: 'disponivel', quartos: 4, banheiros: 5, vagas: 4, area: 412, corretor: 'Marina Rezende', corretor_id: 'u2', destaque: true, publicado: true, cover: 'cv2', fotos: [], descricao: 'Cobertura duplex com terraco gourmet, piscina privativa e vista panoramica para o Parque do Sabia. Acabamento em porcelanato importado e automacao completa.' },
  { id: 2, titulo: 'WTC Uberlandia Corporate', tipo: 'Sala comercial', finalidade: 'Venda', bairro: 'Granja Marileusa', cidade: 'Uberlandia', valor: 890000, status: 'disponivel', quartos: 0, banheiros: 2, vagas: 3, area: 96, corretor: 'Thiago Galassi', corretor_id: 'u3', destaque: true, publicado: true, cover: 'cv1', fotos: [], descricao: 'Laje corporativa no World Trade Center Uberlandia, o endereco de negocios mais valorizado da cidade. Infraestrutura completa, heliponto e certificacao internacional.' },
  { id: 3, titulo: 'Studios Francisco Galassi', tipo: 'Studio', finalidade: 'Venda', bairro: 'Osvaldo Rezende', cidade: 'Uberlandia', valor: 325000, status: 'disponivel', quartos: 1, banheiros: 1, vagas: 1, area: 38, corretor: 'Camila Andrade', corretor_id: 'u4', destaque: false, publicado: true, cover: 'cv5', fotos: [], descricao: 'Studios de alto giro no coracao da cidade. Retorno inteligente para investidores, com gestao de locacao por temporada e rooftop exclusivo.' },
  { id: 4, titulo: 'Residencia Alto Padrao Karaiba', tipo: 'Casa', finalidade: 'Venda', bairro: 'Jardim Karaiba', cidade: 'Uberlandia', valor: 3200000, status: 'reservado', quartos: 5, banheiros: 6, vagas: 6, area: 680, corretor: 'Rafael Boaventura', corretor_id: 'u5', destaque: true, publicado: true, cover: 'cv3', fotos: [], descricao: 'Residencia assinada em condominio fechado, com projeto paisagistico, adega climatizada, home theater e espaco de bem-estar com sauna e piscina aquecida.' },
  { id: 5, titulo: 'Apartamento Garden Vigilato', tipo: 'Apartamento', finalidade: 'Venda', bairro: 'Vigilato Pereira', cidade: 'Uberlandia', valor: 1450000, status: 'disponivel', quartos: 3, banheiros: 3, vagas: 2, area: 210, corretor: 'Marina Rezende', corretor_id: 'u2', destaque: false, publicado: true, cover: 'cv4', fotos: [], descricao: 'Garden com jardim privativo integrado ao living. Plantas amplas, varanda gourmet com churrasqueira e infraestrutura de lazer completa no condominio.' },
  { id: 6, titulo: 'Cobertura Santa Monica', tipo: 'Cobertura', finalidade: 'Venda', bairro: 'Santa Monica', cidade: 'Uberlandia', valor: 1980000, status: 'disponivel', quartos: 4, banheiros: 4, vagas: 3, area: 288, corretor: 'Thiago Galassi', corretor_id: 'u3', destaque: false, publicado: true, cover: 'cv6', fotos: [], descricao: 'Cobertura com rooftop e vista aberta, proxima a Universidade Federal. Excelente liquidez, ideal para moradia de alto padrao ou investimento.' },
  { id: 7, titulo: 'Casa Condominio Granja Marileusa', tipo: 'Casa', finalidade: 'Venda', bairro: 'Granja Marileusa', cidade: 'Uberlandia', valor: 2650000, status: 'disponivel', quartos: 4, banheiros: 5, vagas: 4, area: 520, corretor: 'Camila Andrade', corretor_id: 'u4', destaque: true, publicado: true, cover: 'cv3', fotos: [], descricao: 'Casa contemporanea no bairro planejado mais premiado de Uberlandia. Arquitetura de linhas retas, pe-direito duplo e integracao total com a area externa.' },
  { id: 8, titulo: 'Apartamento Tibery Premium', tipo: 'Apartamento', finalidade: 'Locacao', bairro: 'Tibery', cidade: 'Uberlandia', valor: 6800, status: 'locado', quartos: 3, banheiros: 2, vagas: 2, area: 124, corretor: 'Rafael Boaventura', corretor_id: 'u5', destaque: false, publicado: false, cover: 'cv1', fotos: [], descricao: 'Apartamento mobiliado para locacao executiva, com lazer completo e portaria 24 horas.' },
  { id: 9, titulo: 'Terreno Alto da Boa Vista', tipo: 'Terreno', finalidade: 'Venda', bairro: 'Alto Umuarama', cidade: 'Uberlandia', valor: 980000, status: 'vendido', quartos: 0, banheiros: 0, vagas: 0, area: 800, corretor: 'Marina Rezende', corretor_id: 'u2', destaque: false, publicado: false, cover: 'cv6', fotos: [], descricao: 'Terreno plano em regiao de expansao nobre, pronto para construir.' }
];

// ---------- LEADS ----------
// observacoes: anotacoes do consultor. arquivado: sai do funil sem apagar.
export const mockLeads = [
  { id: 1, nome: 'Eduardo Prado', imovel: 'WTC Uberlandia Corporate', valor: 890000, origem: 'Site', iniciais: 'TG', consultor_id: 'u3', etapa: 'novo', arquivado: false, telefone: '(34) 98800-1010', observacoes: [{ texto: 'Interessado em laje inteira. Pediu proposta com condicao de pagamento.', autor: 'Thiago Galassi', data: '2026-08-15' }] },
  { id: 2, nome: 'Fernanda Lima', imovel: 'Cobertura Duplex Morada da Colina', valor: 2850000, origem: 'Vitrine', iniciais: 'MR', consultor_id: 'u2', etapa: 'novo', arquivado: false, telefone: '(34) 98800-1011', observacoes: [] },
  { id: 3, nome: 'Grupo Andrade Invest', imovel: 'Studios Francisco Galassi', valor: 1300000, origem: 'Indicacao', iniciais: 'CA', consultor_id: 'u4', etapa: 'contato', arquivado: false, telefone: '(34) 98800-1012', observacoes: [{ texto: 'Fundo quer 4 unidades para locacao por temporada.', autor: 'Camila Andrade', data: '2026-08-13' }] },
  { id: 4, nome: 'Ricardo Menezes', imovel: 'Apartamento Garden Vigilato', valor: 1450000, origem: 'Site', iniciais: 'MR', consultor_id: 'u2', etapa: 'contato', arquivado: false, telefone: '(34) 98800-1013', observacoes: [] },
  { id: 5, nome: 'Juliana Castro', imovel: 'Cobertura Santa Monica', valor: 1980000, origem: 'Vitrine', iniciais: 'TG', consultor_id: 'u3', etapa: 'visita', arquivado: false, telefone: '(34) 98800-1014', observacoes: [{ texto: 'Visita marcada para sabado as 10h.', autor: 'Thiago Galassi', data: '2026-08-16' }] },
  { id: 6, nome: 'Marcos Vinicius', imovel: 'Casa Granja Marileusa', valor: 2650000, origem: 'Indicacao', iniciais: 'CA', consultor_id: 'u4', etapa: 'visita', arquivado: false, telefone: '(34) 98800-1015', observacoes: [] },
  { id: 7, nome: 'Patricia Nunes', imovel: 'Residencia Karaiba', valor: 3200000, origem: 'Site', iniciais: 'RB', consultor_id: 'u5', etapa: 'proposta', arquivado: false, telefone: '(34) 98800-1016', observacoes: [{ texto: 'Proposta de 3.05M enviada. Aguardando retorno do casal.', autor: 'Rafael Boaventura', data: '2026-08-14' }] },
  { id: 8, nome: 'Otavio Ferreira', imovel: 'Studios Francisco Galassi', valor: 650000, origem: 'Vitrine', iniciais: 'CA', consultor_id: 'u4', etapa: 'proposta', arquivado: false, telefone: '(34) 98800-1017', observacoes: [] },
  { id: 9, nome: 'Helena Borges', imovel: 'Residencia Karaiba', valor: 3200000, origem: 'Indicacao', iniciais: 'RB', consultor_id: 'u5', etapa: 'fechado', arquivado: false, telefone: '(34) 98800-1018', observacoes: [{ texto: 'Contrato assinado. Comissao lancada no financeiro.', autor: 'Rafael Boaventura', data: '2026-08-10' }] }
];

// ---------- FINANCEIRO ----------
// tipo: 'comissao' (receita) ou 'despesa'. venda: valor do imovel na comissao.
export const mockTransacoes = [
  { id: 't1', tipo: 'comissao', descricao: 'Venda Cobertura Umuarama', consultor_id: 'u2', venda: 2100000, valor: 126000, data: '2026-04-10', status: 'pago' },
  { id: 't2', tipo: 'comissao', descricao: 'Venda Casa Cidade Jardim', consultor_id: 'u4', venda: 1650000, valor: 99000, data: '2026-05-15', status: 'pago' },
  { id: 't3', tipo: 'comissao', descricao: 'Venda Apartamento Jardim Holanda', consultor_id: 'u3', venda: 720000, valor: 43200, data: '2026-06-20', status: 'pago' },
  { id: 't4', tipo: 'comissao', descricao: 'Venda Terreno Alto da Boa Vista', consultor_id: 'u2', venda: 980000, valor: 58800, data: '2026-07-12', status: 'pago' },
  { id: 't5', tipo: 'comissao', descricao: 'Venda Residencia Karaiba', consultor_id: 'u5', venda: 3200000, valor: 192000, data: '2026-08-10', status: 'pendente' },
  { id: 't6', tipo: 'comissao', descricao: 'Venda Sala WTC 2210', consultor_id: 'u3', venda: 850000, valor: 51000, data: '2026-08-05', status: 'pendente' },
  { id: 't7', tipo: 'despesa', descricao: 'Marketing e portais (ZAP e Viva Real)', consultor_id: null, venda: 0, valor: 8500, data: '2026-08-01', status: 'pago' },
  { id: 't8', tipo: 'despesa', descricao: 'Software e infraestrutura', consultor_id: null, venda: 0, valor: 1200, data: '2026-08-01', status: 'pago' },
  { id: 't9', tipo: 'despesa', descricao: 'Marketing e portais (ZAP e Viva Real)', consultor_id: null, venda: 0, valor: 8500, data: '2026-07-01', status: 'pago' }
];
