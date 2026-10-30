import {
  mdiBaseballBat, mdiKnife, mdiKnifeMilitary, mdiHammer, mdiAxe, mdiAxeBattle, mdiSpear,
  mdiTshirtCrew, mdiHardHat, mdiRacingHelmet, mdiShieldAccount,
  mdiMedicalBag, mdiBagPersonal, mdiBone, mdiHeartFlash,
  mdiFlashlight, mdiCamera, mdiMicrophone, mdiBinoculars, mdiMagnify, mdiTestTube,
  mdiToolbox, mdiChip, mdiGauge, mdiPliers, mdiLaptop, mdiTablet, mdiHarddisk,
  mdiBatteryCharging, mdiJumpRope, mdiTent, mdiMap, mdiBottleTonic, mdiBed,
  mdiGasCylinder, mdiGlasses, mdiCarabiner, mdiKey, mdiContentCut,
  mdiDramaMasks, mdiRadioHandheld, mdiCellphone, mdiHeadphones, mdiRadioTower,
  mdiThermometer, mdiTelescope, mdiMagnifyPlus, mdiCameraIris,
  mdiFaceMask, mdiFaceMaskOutline, mdiWeatherPouring, mdiSnowflake, mdiEarHearingOff,
} from '@mdi/js';

const normalizar = nome => String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// Desenhos próprios para objetos sem representação adequada na biblioteca.
const coleteLeve = 'M8 2 10 5H14L16 2 21 6 18 10V22H6V10L3 6ZM8 10V20H16V10L14 7H10Z';
const coleteBalistico = 'M8 2 10 5H14L16 2 21 6 18 10V22H6V10L3 6ZM9 10V18H15V10ZM8 20H16V21H8Z';
const coletePesado = 'M7 2 10 5H14L17 2 22 7 19 12V23H5V12L2 7ZM8 10V15H11V10ZM13 10V15H16V10ZM8 17V21H11V17ZM13 17V21H16V17Z';
const jaqueta = 'M8 2 10 5H14L16 2 20 5 23 16 19 18 17 12V22H7V12L5 18 1 16 4 5ZM11 7V20H13V7Z';
const marreta = 'M3 2H17V9H12V23H8V9H3ZM5 4V7H15V4Z';
const peCabra = 'M17 1 20 4 18 6 16 4 10 10V19L7 23 4 21 7 17V9L14 2ZM6 21 8 19 9 20 7 22Z';
const fita = 'M12 2A10 10 0 1 0 22 12V21H17V20A10 10 0 0 0 12 2ZM12 7A5 5 0 1 1 12 17 5 5 0 0 1 12 7ZM12 10A2 2 0 1 0 12 14 2 2 0 0 0 12 10Z';
const torniquete = 'M2 9H22V15H2ZM4 11V13H20V11ZM8 3H16V6H13V18H16V21H8V18H11V6H8Z';
const lanternaCompacta = 'M7 2H17V7L15 10V21H9V10L7 7ZM9 4V6H15V4ZM11 12V19H13V12Z';
const luzUv = 'M7 5H17V10L15 13V22H9V13L7 10ZM11 15V20H13V15ZM3 1 5 3 4 4 2 2ZM11 0H13V3H11ZM19 1 22 2 20 4 18 3Z';
const roupaEscura = 'M7 2 4 6 1 18 6 20 8 13V22H16V13L18 20 23 18 20 6 17 2ZM9 4V8H15V4Z';
const mascaraFacial = 'M5 2H19L21 5V14L17 21 12 23 7 21 3 14V5ZM5 6V13L9 19 12 21 15 19 19 13V6ZM7 8H17V10H7Z';

export const ICONES_LOJA_ESPIRAL = Object.fromEntries(Object.entries({
  'Objeto Improvisado Leve':mdiBaseballBat, 'Faca':mdiKnifeMilitary, 'Cassetete':'M4 2H8V9H10V12H8V22H4V12H2V9H4Z',
  'Martelo':mdiHammer, 'Facão':mdiKnife, 'Machado':mdiAxe, 'Lança Improvisada':mdiSpear, 'Marreta':marreta, 'Machado Pesado':mdiAxeBattle,
  'Roupa Reforçada':mdiTshirtCrew, 'Jaqueta de Proteção':jaqueta, 'Colete Leve':coleteLeve, 'Colete Balístico':coleteBalistico, 'Colete Pesado':coletePesado,
  'Capacete Reforçado':mdiHardHat, 'Capacete Balístico':mdiRacingHelmet, 'Proteção Antitumulto':mdiShieldAccount,
  'Kit de Primeiros Socorros':mdiMedicalBag, 'Kit Médico':'M3 5H21V21H3ZM8 1H16V5H14V3H10V5H8ZM10 9V12H7V15H10V18H14V15H17V12H14V9Z',
  'Bolsa Médica Avançada':mdiBagPersonal, 'Torniquete':torniquete, 'Tala':mdiBone, 'Desfibrilador Portátil':mdiHeartFlash,
  'Lanterna':mdiFlashlight, 'Câmera':mdiCamera, 'Gravador':mdiMicrophone, 'Binóculos':mdiBinoculars, 'Kit de Evidências':mdiTestTube, 'Lupa / Óptica de Precisão':mdiMagnify, 'Luz Ultravioleta':luzUv,
  'Kit de Ferramentas':mdiToolbox, 'Kit Eletrônico':mdiChip, 'Multímetro':mdiGauge, 'Pé de Cabra':peCabra, 'Fita Reforçada':fita, 'Ferramenta Multiuso':mdiPliers,
  'Notebook':mdiLaptop, 'Tablet':mdiTablet, 'Armazenamento Externo':mdiHarddisk, 'Bateria Portátil':mdiBatteryCharging,
  'Corda':mdiJumpRope, 'Kit de Sobrevivência':mdiTent, 'Mapa':mdiMap, 'Cantíl / Recipiente de Água':mdiBottleTonic, 'Cobertor Térmico':mdiBed, 'Máscara com Filtro':mdiGasCylinder, 'Óculos de Proteção':mdiGlasses, 'Kit de Escalada':mdiCarabiner,
  'Gazuas':mdiKey, 'Cortador de Corrente':mdiContentCut, 'Lanterna Compacta':lanternaCompacta, 'Roupa Escura':roupaEscura, 'Kit de Disfarce':mdiDramaMasks,
  'Rádio Comunicador':mdiRadioHandheld, 'Telefone':mdiCellphone, 'Fone / Comunicador':mdiHeadphones, 'Rádio de Longo Alcance':mdiRadioTower,
  'Visão Noturna':'M1 6H9L11 8H13L15 6H23V18H15L13 16H11L9 18H1ZM3 8V16H7V8ZM17 8V16H21V8ZM4 10H6V14H4ZM18 10H20V14H18Z', 'Visão Térmica':mdiThermometer, 'Luneta':mdiTelescope, 'Monóculo / Óptica de Ampliação':mdiMagnifyPlus, 'Câmera Térmica Portátil':mdiCameraIris,
  'Máscara Respiratória':mdiFaceMask, 'Respirador Profissional':mdiFaceMaskOutline, 'Roupa Impermeável':mdiWeatherPouring, 'Roupa Térmica':mdiSnowflake, 'Protetor Auricular':mdiEarHearingOff, 'Máscara de Proteção Facial':mascaraFacial,
}).map(([nome,path]) => [normalizar(nome),path]));

export function iconeLojaEspiral(item) {
  return ICONES_LOJA_ESPIRAL[normalizar(item.name)];
}
