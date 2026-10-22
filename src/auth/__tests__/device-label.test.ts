/**
 * `deviceLabel` is sent to the server and kept there, so it must carry
 * nothing personal (CLAUDE.md, "Students are minors").
 *
 * The mock below is the trap this guards: `Device.deviceName` is set by
 * whoever owns the phone, and Expo's own documented example for it is
 * "Vivian's iPhone XS". Reaching for the obvious-looking property would send
 * a real name to the backend.
 */
import * as Device from "expo-device";

import { deviceLabel } from "../device-label";

jest.mock("expo-device", () => ({
  modelName: "Pixel 7",
  deviceName: "Maria's Phone",
}));

describe("the label sent for this phone", () => {
  test("is the model", () => {
    expect(deviceLabel()).toBe("Pixel 7");
  });

  test("is never the name the owner gave the phone", () => {
    expect(deviceLabel()).not.toContain("Maria");
  });

  test("is left out rather than guessed when the model is unknown", () => {
    // Some Android builds report no model at all.
    jest.replaceProperty(Device, "modelName", null);

    expect(deviceLabel()).toBeUndefined();
  });
});
