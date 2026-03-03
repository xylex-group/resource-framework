// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EntityFormV2 } from "../entity-form_v2";
import { defineResourceFormSchema } from "@/utils/resource-forms";

const schema = defineResourceFormSchema({
  entity: "customer_profile",
  steps: {
    details: [
      {
        key: "first_name",
        label: "First name",
        type: "text",
        required: true,
      },
    ],
    review_confirmation: [
      {
        key: "final_note",
        label: "Final note",
        type: "text_area",
      },
    ],
  },
  step_order: ["review_confirmation", "details"],
  show_submit_button: true,
});

function Harness(props: {
  initialValues?: Record<string, unknown>;
  onSubmit?: () => void;
  onStepChange?: (stepIndex: number, stepKey: string) => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(props.initialValues ?? {});

  return (
    <EntityFormV2
      schema={schema}
      values={values}
      onChange={(key, value) => {
        setValues((current) => ({ ...current, [key]: value }));
      }}
      onSubmit={props.onSubmit ?? (() => undefined)}
      onStepChange={props.onStepChange}
    />
  );
}

describe("EntityFormV2", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses shared ordered-step resolution for the first rendered step", () => {
    render(<Harness />);

    expect(
      screen.getByRole("heading", { name: "review confirmation" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
  });

  it("blocks submit when the active step has missing required fields", () => {
    const onSubmit = vi.fn();

    render(<Harness initialValues={{ step: "details" }} onSubmit={onSubmit} />);

    expect(screen.getByRole("heading", { name: "details" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getByText("First name is required.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("advances steps and submits once required fields are satisfied", () => {
    const onSubmit = vi.fn();
    const onStepChange = vi.fn();
    const { container } = render(
      <Harness onSubmit={onSubmit} onStepChange={onStepChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "details" })).toBeTruthy();

    const input = container.querySelector('input[name="first_name"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("Expected first_name input");
    }

    fireEvent.change(input, { target: { value: "Taylor" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onStepChange).toHaveBeenCalledWith(1, "details");
  });
});
