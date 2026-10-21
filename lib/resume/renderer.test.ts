import { readFileSync } from "fs";
import { resolve } from "path";
import { Packer } from "docx";
import { describe, expect, it } from "vitest";
import { parseResume } from "./parser";
import { renderResume } from "./renderer";

describe("renderResume", () => {
  it("turns the example resume into a valid .docx archive", async () => {
    const markdown = readFileSync(resolve(__dirname, "../../examples/sample-resume.md"), "utf-8");
    const buffer = await Packer.toBuffer(renderResume(parseResume(markdown)));

    // .docx is a zip archive; check the local file header signature.
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");
    expect(buffer.length).toBeGreaterThan(5_000);
  });
});
