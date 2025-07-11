import React from "react";
import { render } from "@testing-library/react-native";
import BellCurveChart from "../BellCurveChart";

test("renders bars and axis labels", () => {
  const { getAllByLabelText, getByText } = render(
    <BellCurveChart counts={[10, 20, 30]} />,
  );
  expect(getAllByLabelText("count bar").length).toBe(3);
  getByText("1");
  getByText("2");
  getByText("3");
});
