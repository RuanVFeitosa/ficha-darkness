import {
  mdiAmmunition,
  mdiAxe,
  mdiBagPersonalOutline,
  mdiBarrel,
  mdiBaseballBat,
  mdiBattery,
  mdiBowArrow,
  mdiBoxCutter,
  mdiBriefcaseVariantOutline,
  mdiCreationOutline,
  mdiFlashlight,
  mdiHammer,
  mdiHardHat,
  mdiKnife,
  mdiKnifeMilitary,
  mdiLightningBolt,
  mdiLink,
  mdiMagazineRifle,
  mdiMapMarkerPath,
  mdiMedicalBag,
  mdiPackageVariantClosed,
  mdiPistol,
  mdiRadar,
  mdiSawBlade,
  mdiShield,
  mdiShieldAccountOutline,
  mdiShieldHalfFull,
  mdiSword,
  mdiTargetVariant,
  mdiTools,
} from "@mdi/js";

import ak47Icon from "../assets/icons/fireWeapons/ak47.svg";
import ak47uIcon from "../assets/icons/fireWeapons/ak47u.svg";
import bayonetIcon from "../assets/icons/fireWeapons/bayonet.svg";
import c96Icon from "../assets/icons/fireWeapons/c96.svg";
import coltM1911Icon from "../assets/icons/fireWeapons/colt-m1911.svg";
import desertEagleIcon from "../assets/icons/fireWeapons/desert-eagle.svg";
import famasIcon from "../assets/icons/fireWeapons/famas.svg";
import fnFalIcon from "../assets/icons/fireWeapons/fn-fal.svg";
import glockIcon from "../assets/icons/fireWeapons/glock.svg";
import leeEnfieldIcon from "../assets/icons/fireWeapons/lee-enfield.svg";
import lugerIcon from "../assets/icons/fireWeapons/luger.svg";
import machineGunIcon from "../assets/icons/fireWeapons/machine-gun.svg";
import musketIcon from "../assets/icons/fireWeapons/musket.svg";
import p90Icon from "../assets/icons/fireWeapons/p90.svg";
import revolverIcon from "../assets/icons/fireWeapons/revolver.svg";
import steyrAugIcon from "../assets/icons/fireWeapons/steyr-aug.svg";
import thompsonIcon from "../assets/icons/fireWeapons/thompson-m1.svg";
import winchesterIcon from "../assets/icons/fireWeapons/winchester-rifle.svg";

const normalizarTexto = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const contem = (texto, termos) => termos.some((termo) => texto.includes(termo));

export const obterIconeItem = (item = {}) => {
  const nome = normalizarTexto(item.nome);
  const tipo = normalizarTexto(item.tipo || item.categoria || item.detalhes);
  const statusTipo = normalizarTexto(item.armaStatus?.tipo);
  const texto = `${nome} ${tipo} ${statusTipo}`;

  if (contem(texto, ["pistola sable", "pistola", "glock", "9mm"]))
    return glockIcon;
  if (contem(texto, ["revolver"])) return revolverIcon;
  if (contem(texto, ["desert eagle"])) return desertEagleIcon;
  if (contem(texto, ["colt", "m1911"])) return coltM1911Icon;
  if (contem(texto, ["luger"])) return lugerIcon;

  if (contem(texto, ["fuzil de assalto", "helena", "ak47", "fuzil"]))
    return fnFalIcon;
  if (contem(texto, ["ak47u", "submetralhadora", "smg"])) return ak47uIcon;
  if (contem(texto, ["famas"])) return famasIcon;
  if (contem(texto, ["fn fal", "fn-fal"])) return fnFalIcon;
  if (contem(texto, ["steyr", "aug"])) return steyrAugIcon;

  if (contem(texto, ["rifle de precisao", "sniper", "mk12"]))
    return leeEnfieldIcon;
  if (contem(texto, ["winchester"])) return winchesterIcon;
  if (contem(texto, ["mosquete", "musket"])) return musketIcon;

  if (contem(texto, ["escopeta", "ruptura", "shotgun"])) return winchesterIcon;

  if (contem(texto, ["metralhadora", "machine gun"])) return machineGunIcon;
  if (contem(texto, ["thompson"])) return thompsonIcon;
  if (contem(texto, ["p90"])) return p90Icon;
  if (contem(texto, ["arco", "Arco", "Arco Silencioso"]))
    return mdiBowArrow;

  if (contem(texto, ["baioneta", "bayonet", "faca", "punhal", "lamina"]))
    return bayonetIcon;

  if (contem(texto, ["maleta", "briefcase"])) return mdiBriefcaseVariantOutline;
  if (contem(texto, ["kit", "trauma", "socorros", "medic"]))
    return mdiMedicalBag;
  if (contem(texto, ["municao", "bala", "cartucho", "ammunition"]))
    return mdiAmmunition;
  if (contem(texto, ["rastreador", "sinal", "radar"])) return mdiRadar;
  if (contem(texto, ["lanterna"])) return mdiFlashlight;
  if (contem(texto, ["bateria"])) return mdiBattery;
  if (contem(texto, ["mapa", "rota"])) return mdiMapMarkerPath;

  if (contem(texto, ["katana", "espada", "sabre", "rapieira", "florete"]))
    return mdiSword;
  if (contem(texto, ["faca", "punhal", "canivete", "facao", "lamina"]))
    return mdiKnifeMilitary;
  if (contem(texto, ["machado", "machadinha"])) return mdiAxe;
  if (contem(texto, ["martelo"])) return mdiHammer;
  if (contem(texto, ["serra"])) return mdiSawBlade;
  if (contem(texto, ["corrente"])) return mdiLink;
  if (contem(texto, ["taser"])) return mdiLightningBolt;
  if (contem(texto, ["bastao", "cassetete", "nunchaku", "chicote"]))
    return mdiBaseballBat;
  if (contem(texto, ["soqueira"])) return mdiBoxCutter;
  if (contem(texto, ["lanca"])) return mdiKnife;

  if (contem(texto, ["capacete", "elmo", "craniano"])) return mdiHardHat;
  if (contem(texto, ["colete", "placa", "blindagem", "jaqueta", "manto"]))
    return mdiShieldAccountOutline;
  if (contem(texto, ["mascara", "visor"])) return mdiShieldHalfFull;
  if (contem(texto, ["defesa", "defesas", "kevlar"])) return mdiShield;

  if (contem(texto, ["rito", "absoluto", "poder"])) return mdiCreationOutline;
  if (contem(texto, ["arma", "combate"])) return mdiTools;
  if (contem(texto, ["mochila", "item"])) return mdiBagPersonalOutline;

  return mdiPackageVariantClosed;
};
