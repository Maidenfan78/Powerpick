import React from "react";
import { render } from "@testing-library/react-native";
import BellCurveChart from "../BellCurveChart";

test("renders bars for each count", () => {
  const { getByLabelText } = render(<BellCurveChart counts={[1, 2, 3]} />);
  const container = getByLabelText("Bell curve chart");
  expect(container.props.children.length).toBe(3);
});
