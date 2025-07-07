const sql = `\
CREATE INDEX IF NOT EXISTS draws_game_id_draw_number ON public.draws (game_id, draw_number);
CREATE INDEX IF NOT EXISTS draw_results_draw_id ON public.draw_results (draw_id);
CREATE INDEX IF NOT EXISTS ball_types_game_id ON public.ball_types (game_id);
`;
export default sql;

if (typeof require !== "undefined" && require.main === module) {
  console.log(sql.trim());
}
