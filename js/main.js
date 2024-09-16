import { Atmosphere4401 } from "./4401-81.js";
import { Aerodynamics } from "./aerodynamic.js";
import { Model } from "./model.js";
import { View } from "./view.js";
import { initRorg, initMurg, initNurg, initLarg, deg2rad, modulOfValue } from "./helper.js";

class FlySpace extends Model {
    #eps = 1e-4;

    constructor(N, Kv, Kn, Ke) {
        super(Kv, Kn, Ke);

        this.N = N;
        this.THETc = deg2rad(-39);
        this.V = 4790 - 10 * N;
        this.dt = 1e-3;

        this.stage = [
            0,                                        // [0] this.t, 
            0,                                        // [1] this.Xg, 
            40000 - 100 * this.N,                     // [2] this.Yg, 
            0,                                        // [3] this.Zg, 
            deg2rad(-39),                             // [4] this.thet, 
            0,                                        // [5] this.psi, 
            0,                                        // [6] this.gama, 
            0,                                        // [7] this.alpha, 
            0,                                        // [8] this.betta, 
            this.V * math.cos(this.THETc),            // [9] this.Vxg, 
            this.V * math.sin(this.THETc),            // [10] this.Vyg, 
            0,                                        // [11] this.Vzg, 
            0,                                        // [12] this.deltavf, 
            0,                                        // [13] this.deltanf, 
            0,                                        // [14] this.deltaef, 
            0.4,                                      // [15] this.wx, 
            0,                                        // [16] this.wy, 
            0,                                        // [17] this.wz, 
            initRorg(0, deg2rad(-39), 0),             // [18] this.rhoRG, 
            initLarg(0, deg2rad(-39), 0),             // [19] this.lyRG, 
            initMurg(0, deg2rad(-39), 0),             // [20] this.muRG, 
            initNurg(0, deg2rad(-39), 0),             // [21] this.nuRG
        ];

        this.stageRender = this.stage.map(val => [val]);
        this.getFly();

    }

    copyList(arr) {
        return [...arr]
    }

    getNewAdh(stage) {
        let [h, Vxg, Vyg, Vzg, wx, wy, wz, alpha, beta, deltav, deltan, deltae] = [stage[2],stage[9],stage[10],stage[11],stage[15],stage[16],stage[17],stage[7],stage[8],stage[12],stage[13],stage[14]];

        const V = modulOfValue(Vxg, Vyg, Vzg);
        const atm = new Atmosphere4401(h);
        const M = V / atm.a;
        const q = atm.rho * V ** 2 / 2;
        const adh = new Aerodynamics(M, V, q, wx, wy, wz, alpha, beta, deltav, deltan, deltae)

        return [adh.X, adh.Y, adh.Z, adh.Mx, adh.My, adh.Mz];
    }

    getForceInNzsk(stage, X, Y, Z) {
        let [rho, ly, mu, nu] = [stage[18], stage[19], stage[20], stage[21]];

        const Fssk = [[-X], [Y], [Z]];
        const Anzsk_ssk = this.nzsk_ssk(rho, ly, mu, nu);
        const Fnzsk = math.multiply(math.inv(Anzsk_ssk), Fssk);

        return [Fnzsk[0][0], Fnzsk[1][0], Fnzsk[2][0]]
    }

    updateRgParam(stage) {
        let [rho, ly, mu, nu] = [stage[18], stage[19], stage[20], stage[21]];
        const rgNorm = modulOfValue(rho, ly, mu, nu)
        rho /= rgNorm;
        ly /= rgNorm;
        mu /= rgNorm;
        nu /= rgNorm;
        [stage[18], stage[19], stage[20], stage[21]] = [rho, ly, mu, nu];
    }

    getVssk(stage) {
        let [Vxg, Vyg, Vzg] = [stage[9], stage[10], stage[11]];
        let [rho, ly, mu, nu] = [stage[18], stage[19], stage[20], stage[21]];

        const Vnzsk = [[Vxg], [Vyg], [Vzg]];
        const Anzsk_sskRG = this.nzsk_ssk(rho, ly, mu, nu);
        const Vssk = math.multiply(Anzsk_sskRG, Vnzsk);

        return Vssk
    }

    updateAngularValues(stage, Vssk) {
        let [thet, psi, gamma, alpha, betta] = [stage[4], stage[5], stage[6], stage[7], stage[8]];
        let [rho, ly, mu, nu] = [stage[18], stage[19], stage[20], stage[21]];

        thet = this.thetf(rho, ly, mu, nu);
        psi = this.psif(rho, ly, mu, nu);
        gamma = this.gammaf(rho, ly, mu, nu);
        alpha = this.alphaf(Vssk[1][0], Vssk[0][0]);
        betta = this.bettaf(Vssk[2][0], modulOfValue(Vssk[0][0], Vssk[1][0], Vssk[2][0]));

        [stage[4], stage[5], stage[6], stage[7], stage[8]] = [thet, psi, gamma, alpha, betta];
    }

    updateDeltaValues(stage, stage_prev, step) {
        let [thet, psi, gamma] = [stage[4], stage[5], stage[6]];
        let [thet_prev, psi_prev, gamma_prev] = [stage_prev[4], stage_prev[5], stage_prev[6]];
        let [dv, dn, de] = [stage[12], stage[13], stage[14]];

        dv = this.deltavf(thet, thet_prev, step);
        dn = this.deltanf(psi, psi_prev, step);
        de = this.deltaef(gamma, gamma_prev, step);

        [stage[12], stage[13], stage[14]] = [dv, dn, de];
    }

    filterValues(level = 25) {
        if (+this.stage[0].toFixed(3) * 100 % level === 0 || (this.#eps >= this.stage[2] > 0)) 
            for (let c = 0; c < this.stageRender.length; c++) 
                this.stageRender[c].push(this.stage[c]);
    }

    getFly() {
        while (this.stage[2] >= this.#eps) {
            // debugger
            // this.stage[0]=+this.stage[0].toFixed(3)
            const stage_prev = this.copyList(this.stage);
            const [X, Y, Z, Mx, My, Mz] = this.getNewAdh(this.stage);
            const [Fxg, Fyg, Fzg] = this.getForceInNzsk(this.stage, X, Y, Z);

            // Пересчет параметров
            this.euler(this.stage, Fxg, Fyg, Fzg, Mx, My, Mz, this.dt);
            this.updateRgParam(this.stage);
            this.updateAngularValues(this.stage, this.getVssk(this.stage));
            this.updateDeltaValues(this.stage, stage_prev, this.dt)
            
            this.stage[0] += this.dt;

            if (this.stage[2] < 0) {
                this.stage = this.copyList(stage_prev);
                this.dt /= 10;
                continue;
            }

            this.filterValues(1);
        }
    }
}

const initFly = new FlySpace(12, 1, 1, 0.55);
const renderData = new View(initFly.stageRender);
// initFly.getFly();
renderData.getResult();
