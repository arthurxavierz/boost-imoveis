-- ============================================================
-- BOOST IMOVEIS - DADOS DE EXEMPLO
-- ============================================================
-- Rode este arquivo DEPOIS do schema.sql, tambem no SQL Editor.
-- Ele carrega os imoveis e leads de demonstracao no banco.
-- Rode apenas uma vez. Rodar de novo cria duplicatas.
-- ============================================================

insert into imoveis (titulo, tipo, finalidade, bairro, cidade, valor, status, quartos, banheiros, vagas, area, corretor, destaque, publicado, cover, descricao) values
('Cobertura Duplex Morada da Colina', 'Cobertura', 'Venda', 'Morada da Colina', 'Uberlandia', 2850000, 'disponivel', 4, 5, 4, 412, 'Marina Rezende', true, true, 'cv2', 'Cobertura duplex com terraco gourmet, piscina privativa e vista panoramica para o Parque do Sabia. Acabamento em porcelanato importado e automacao completa.'),
('WTC Uberlandia Corporate', 'Sala comercial', 'Venda', 'Granja Marileusa', 'Uberlandia', 890000, 'disponivel', 0, 2, 3, 96, 'Thiago Galassi', true, true, 'cv1', 'Laje corporativa no World Trade Center Uberlandia, o endereco de negocios mais valorizado da cidade. Infraestrutura completa, heliponto e certificacao internacional.'),
('Studios Francisco Galassi', 'Studio', 'Venda', 'Osvaldo Rezende', 'Uberlandia', 325000, 'disponivel', 1, 1, 1, 38, 'Camila Andrade', false, true, 'cv5', 'Studios de alto giro no coracao da cidade. Retorno inteligente para investidores, com gestao de locacao por temporada e rooftop exclusivo.'),
('Residencia Alto Padrao Karaiba', 'Casa', 'Venda', 'Jardim Karaiba', 'Uberlandia', 3200000, 'reservado', 5, 6, 6, 680, 'Rafael Boaventura', true, true, 'cv3', 'Residencia assinada em condominio fechado, com projeto paisagistico, adega climatizada, home theater e espaco de bem-estar com sauna e piscina aquecida.'),
('Apartamento Garden Vigilato', 'Apartamento', 'Venda', 'Vigilato Pereira', 'Uberlandia', 1450000, 'disponivel', 3, 3, 2, 210, 'Marina Rezende', false, true, 'cv4', 'Garden com jardim privativo integrado ao living. Plantas amplas, varanda gourmet com churrasqueira e infraestrutura de lazer completa no condominio.'),
('Cobertura Santa Monica', 'Cobertura', 'Venda', 'Santa Monica', 'Uberlandia', 1980000, 'disponivel', 4, 4, 3, 288, 'Thiago Galassi', false, true, 'cv6', 'Cobertura com rooftop e vista aberta, proxima a Universidade Federal. Excelente liquidez, ideal para moradia de alto padrao ou investimento.'),
('Casa Condominio Granja Marileusa', 'Casa', 'Venda', 'Granja Marileusa', 'Uberlandia', 2650000, 'disponivel', 4, 5, 4, 520, 'Camila Andrade', true, true, 'cv3', 'Casa contemporanea no bairro planejado mais premiado de Uberlandia. Arquitetura de linhas retas, pe-direito duplo e integracao total com a area externa.'),
('Apartamento Tibery Premium', 'Apartamento', 'Locacao', 'Tibery', 'Uberlandia', 6800, 'locado', 3, 2, 2, 124, 'Rafael Boaventura', false, false, 'cv1', 'Apartamento mobiliado para locacao executiva, com lazer completo e portaria 24 horas.'),
('Terreno Alto da Boa Vista', 'Terreno', 'Venda', 'Alto Umuarama', 'Uberlandia', 980000, 'vendido', 0, 0, 0, 800, 'Marina Rezende', false, false, 'cv6', 'Terreno plano em regiao de expansao nobre, pronto para construir.');

insert into leads (nome, imovel, valor, origem, iniciais, etapa) values
('Eduardo Prado', 'WTC Uberlandia Corporate', 890000, 'site', 'TG', 'novo'),
('Fernanda Lima', 'Cobertura Duplex Morada da Colina', 2850000, 'vitrine', 'MR', 'novo'),
('Grupo Andrade Invest', 'Studios Francisco Galassi', 1300000, 'indicacao', 'CA', 'contato'),
('Ricardo Menezes', 'Apartamento Garden Vigilato', 1450000, 'site', 'MR', 'contato'),
('Juliana Castro', 'Cobertura Santa Monica', 1980000, 'vitrine', 'TG', 'visita'),
('Marcos Vinicius', 'Casa Granja Marileusa', 2650000, 'indicacao', 'CA', 'visita'),
('Patricia Nunes', 'Residencia Karaiba', 3200000, 'site', 'RB', 'proposta'),
('Otavio Ferreira', 'Studios Francisco Galassi', 650000, 'vitrine', 'CA', 'proposta'),
('Helena Borges', 'Residencia Karaiba', 3200000, 'indicacao', 'RB', 'fechado');
