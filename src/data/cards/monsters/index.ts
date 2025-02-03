import type { IMonsterCard } from "../../card-types";

import thunders from "./thunders";

const monsters: IMonsterCard[] = ([] as IMonsterCard[]).concat(
    thunders,
);

export default monsters;