import tokens from "../../app/tokens.json";

export const gameColors: Record<string, string> = {
  "Saturday Lotto": tokens.color.game.saturdayLotto.value,
  "Oz Lotto": tokens.color.game.ozLotto.value,
  Powerball: tokens.color.game.powerball.value,
  "Set for Life": tokens.color.game.setForLife.value,
  "Weekday Windfall": tokens.color.game.weekdayWindfall.value,
};

export const getGameColor = (name: string): string =>
  gameColors[name] ?? tokens.color.brand.highlight.value;
