export const rad2deg = radian => radian * 180 / math.pi;
export const deg2rad = degree => degree * math.pi / 180;
export const modulOfValue = (...values) => math.sqrt(values.reduce((acc, value) => acc + value ** 2, 0));
export const initRorg = (psi, thet, gamma) =>  math.cos(psi / 2) * math.cos(thet / 2) * math.cos(gamma / 2) - math.sin(psi / 2) * math.sin(thet / 2) * math.sin(gamma / 2);
export const initLarg = (psi, thet, gamma) =>  math.sin(psi / 2) * math.sin(thet / 2) * math.cos(gamma / 2) + math.cos(psi / 2) * math.cos(thet / 2) * math.sin(gamma / 2);
export const initMurg = (psi, thet, gamma) =>  math.sin(psi / 2) * math.cos(thet / 2) * math.cos(gamma / 2) + math.cos(psi / 2) * math.sin(thet / 2) * math.sin(gamma / 2);
export const initNurg = (psi, thet, gamma) =>  math.cos(psi / 2) * math.sin(thet / 2) * math.cos(gamma / 2) - math.sin(psi / 2) * math.cos(thet / 2) * math.sin(gamma / 2);
