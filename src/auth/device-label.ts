/**
 * A name for this phone that a parent could recognise later, sent with
 * sign-up and sign-in as `deviceLabel` (docs/TALAAN-API.md).
 *
 * **`modelName`, never `deviceName`.** `Device.deviceName` is set by whoever
 * owns the phone and routinely contains a real name — Expo's own documented
 * example is "Vivian's iPhone XS". This value is sent to the server and kept
 * there, so it must carry nothing personal (CLAUDE.md, "Students are
 * minors"). `Device.modelName` is the manufacturer's name for the model,
 * like "Pixel 7".
 */
import * as Device from "expo-device";

export function deviceLabel(): string | undefined {
  return Device.modelName ?? undefined;
}
