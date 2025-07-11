import React from "react";
import { render } from "@testing-library/react-native";
import BellCurveChart from "../BellCurveChart";
import { Bucket } from "../../lib/buildSumBuckets";

test("renders bars and axis labels", () => {
  const buckets: Bucket[] = [
    { label: "0-4", mid: 2.5, freq: 10 },
    { label: "5-9", mid: 7.5, freq: 20 },
    { label: "10-14", mid: 12.5, freq: 30 },
  ];
  const { getAllByLabelText, getByText } = render(
    <BellCurveChart buckets={buckets} />,
  );
  expect(getAllByLabelText("histogram bar").length).toBe(3);
  getByText("0-4");
  getByText("5-9");
  getByText("10-14");
});
