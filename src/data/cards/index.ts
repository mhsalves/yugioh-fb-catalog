import { ICard } from '../card-types';
import c425 from './425';
import c674 from './674';
import support from './support';

const group0_50: ICard[] = [];
const group51_100: ICard[] = [];
const group101_150: ICard[] = [];
const group151_200: ICard[] = [];
const group201_250: ICard[] = [];
const group251_300: ICard[] = [];
const group301_350: ICard[] = [];
const group351_400: ICard[] = [];
const group401_450: ICard[] = [c425];
const group451_500: ICard[] = [];
const group501_550: ICard[] = [];
const group551_600: ICard[] = [];
const group601_650: ICard[] = [];
const group651_700: ICard[] = [c674];
const group701_750: ICard[] = [];

const base: ICard[] = [];

export default base.concat(
    group0_50, group101_150, group51_100,
    group151_200, group201_250,
    group251_300, group301_350,
    group351_400, group401_450,
    group451_500, group501_550,
    group551_600, group601_650,
    group651_700, group701_750,
    support,
).sort((cardA, cardB) => cardA.id > cardB.id ? 1 : -1);
