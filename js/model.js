export class Model {
    #m = 1200; // кг
    #Ix = 180; // кг*м^2
    #Iy = 700; // кг*м^2
    #Iz = 700; // кг*м^2
    #g = 9.80665; // м/c^2

    constructor(Kv, Kn, Ke) {
        this.Kv = Kv;
        this.Kn = Kn;
        this.Ke1 = Ke;
        this.Ke2 = Ke;
    }

    dvxg(Fxg) {
        return Fxg / this.#m;
    }

    dvyg(Fyg) {
        return Fyg / this.#m - this.#g;
    }

    dvzg(Fzg) {
        return Fzg / this.#m;
    }

    dxg(vxg) {
        return vxg;
    }

    dyg(vyg) {
        return vyg;
    }

    dzg(vzg) {
        return vzg;
    }

    dwx(Mx, wy, wz) {
        return Mx / this.#Ix - (this.#Iz - this.#Iy) * wy * wz / this.#Ix;
    }

    dwy(My, wx, wz) {
        return My / this.#Iy - (this.#Ix - this.#Iz) * wx * wz / this.#Iy;
    }

    dwz(Mz, wx, wy) {
        return Mz / this.#Iz - (this.#Iy - this.#Ix) * wx * wy / this.#Iz;
    }

    drhoRG(rorg, larg, murg, nurg, wx, wy, wz) {
        return -(wx * larg + wy * murg + wz * nurg) / 2;
    }

    dlyRG(rorg, larg, murg, nurg, wx, wy, wz) {
        return (wx * rorg - wy * nurg + wz * murg) / 2;
    }

    dmuRG(rorg, larg, murg, nurg, wx, wy, wz) {
        return (wx * nurg + wy * rorg - wz * larg) / 2;
    }

    dnuRG(rorg, larg, murg, nurg, wx, wy, wz) {
        return (-wx * murg + wy * larg + wz * rorg) / 2;
    }

    thetf(rho, ly, mu, nu) {
        return math.asin(2 * (rho * nu + ly * mu));
    }

    psif(rho, ly, mu, nu) {
        return math.atan2(2 * (rho * mu - ly * nu), rho ** 2 + ly ** 2 - mu ** 2 - nu ** 2);
    }

    gammaf(rho, ly, mu, nu) {
        return math.atan2(2 * (rho * ly - mu * nu), rho ** 2 - ly ** 2 + mu ** 2 - nu ** 2);
    }

    alphaf(vy, vx) {
        return -math.atan2(vy, vx);
    }

    bettaf(vz, V) {
        return math.asin(vz / V);
    }

    deltavf(thet, thet_prev, dt) {
        const dthet = (thet - thet_prev) / dt;
        return -this.Kv * dthet;
    }

    deltanf(psi, psi_prev, dt) {
        const dpsi = (psi - psi_prev) / dt;
        return -this.Kn * dpsi;
    }

    deltaef(gama, gama_prev, dt) {
        const dgama = (gama - gama_prev) / dt;
        return -this.Ke1 * dgama - this.Ke2 * gama;
    }

    nzsk_ssk(rho, ly, mu, nu) {
        const A = [
            [rho ** 2 + ly ** 2 - mu ** 2 - nu ** 2, 2 * (rho * nu + ly * mu), 2 * (-rho * mu + ly * nu)],
            [2 * (-rho * nu + ly * mu), rho ** 2 - ly ** 2 + mu ** 2 - nu ** 2, 2 * (rho * ly + nu * mu)],
            [2 * (rho * mu + ly * nu), 2 * (-rho * ly + mu * nu), rho ** 2 - ly ** 2 - mu ** 2 + nu ** 2]
        ];
        return A;
    }

    euler(stage, Fxg, Fyg, Fzg, Mx, My, Mz, dt) {
        let [vxg, vyg, vzg, wx, wy, wz, rhoRG, lyRG, muRG, nuRG] = [stage[9], stage[10], stage[11], stage[15], stage[16], stage[17], stage[18], stage[19], stage[20], stage[21]]

        stage[9] += this.dvxg(Fxg) * dt;
        stage[10] += this.dvyg(Fyg) * dt;
        stage[11] += this.dvzg(Fzg) * dt;
        stage[1] += this.dxg(vxg) * dt;
        stage[2] += this.dyg(vyg) * dt;
        stage[3] += this.dzg(vzg) * dt;
        stage[15] += this.dwx(Mx, wy, wz) * dt;
        stage[16] += this.dwy(My, wx, wz) * dt;
        stage[17] += this.dwz(Mz, wx, wy) * dt;
        stage[18] += this.drhoRG(rhoRG, lyRG, muRG, nuRG, wx, wy, wz) * dt;
        stage[19] += this.dlyRG(rhoRG, lyRG, muRG, nuRG, wx, wy, wz) * dt;
        stage[20] += this.dmuRG(rhoRG, lyRG, muRG, nuRG, wx, wy, wz) * dt;
        stage[21] += this.dnuRG(rhoRG, lyRG, muRG, nuRG, wx, wy, wz) * dt;
    }
}
