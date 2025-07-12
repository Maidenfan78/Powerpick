import { fetchRecentDraws, _clearCaches } from "../gamesApi";
import { supabase } from "../supabase";

jest.mock("../supabase", () => ({
  supabase: { from: jest.fn() },
}));

describe("fetchRecentDraws", () => {
  beforeEach(() => {
    _clearCaches();
    jest.clearAllMocks();
  });

  test("returns all draw rows in descending order", async () => {
    const rows = [
      { draw_number: 2, draw_date: "2024-01-02", draw_results: [] },
      { draw_number: 1, draw_date: "2024-01-01", draw_results: [] },
    ];
    const mockOrder = jest.fn().mockResolvedValue({ data: rows, error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: mockOrder,
    });
    const result = await fetchRecentDraws("g1", true);
    expect(result).toHaveLength(2);
    expect(mockOrder).toHaveBeenCalledWith("draw_number", { ascending: false });
  });
});
