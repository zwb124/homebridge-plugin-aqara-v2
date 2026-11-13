import type { API } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { AqaraHomebridgePlatform } from './platform.js';

/** Register the Aqara platform with Homebridge. */
export default (api: API): void => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, AqaraHomebridgePlatform);
};
