import { API, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service } from 'homebridge';

import { LumiAirerAcn001, LumiAirerAcn02, VirtualIrTv } from './accessories/index.js';
import { AqaraApi, AqaraApiOption } from './api/index.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

interface AqaraPlatformConfig extends PlatformConfig, AqaraApiOption {
  positionId?: string;
}

export class AqaraHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  public readonly aqaraApi!: AqaraApi;

  public readonly accessories: AqaraPlatformAccessory[] = [];

  private tokenRefreshTimer?: NodeJS.Timeout;

  constructor(public readonly log: Logger, public readonly config: AqaraPlatformConfig, public readonly api: API) {
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    this.log.debug('Finished initializing platform:', this.config.name);
    const { account } = this.config;
    if (account) {
      this.aqaraApi = new AqaraApi({
        ...this.config,
        storagePath: this.api.user.storagePath(),
      }, this.log);
      this.api.on('didFinishLaunching', () => {
        this.tokenRefreshTimer = setInterval(() => {
          void this.aqaraApi.refreshToken().catch((error) => this.log.error('Failed to refresh Aqara token:', error));
        }, 1000 * 60 * 60 * 24 * 7);

        this.discoverDevices();
      });

      this.api.on('shutdown', () => {
        if (this.tokenRefreshTimer) {
          clearInterval(this.tokenRefreshTimer);
        }
      });
    } else {
      this.log.error('Missing account');
    }
  }

  configureAccessory(accessory: PlatformAccessory) {
    const context = accessory.context as Partial<AqaraPlatformAccessoryContext>;
    if (!context.deviceInfo) {
      this.log.warn('Skipping cached accessory with missing Aqara device information:', accessory.displayName);
      return;
    }

    const aqaraAccessory = accessory as AqaraPlatformAccessory;
    this.log.info('Loading accessory from cache:', aqaraAccessory.displayName);
    this.accessories.push(aqaraAccessory);
  }

  discoverDevices() {
    this.aqaraApi.getAllDevices(this.config.positionId).then((devices) => {
      devices.forEach((device) => this.handleDevice(device));
    });
  }

  private handleDevice(device: Aqara.DeviceInfo) {
    const AccessoryClass = this.getAccessoryClass(device);
    if (!AccessoryClass) {
      return;
    }
    const uuid = this.api.hap.uuid.generate(device.did);
    const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
    if (existingAccessory) {
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
      existingAccessory.context = {
        deviceInfo: device,
      };
      this.api.updatePlatformAccessories([existingAccessory]);
      new AccessoryClass(this, existingAccessory);
    } else {
      this.log.info('Adding new accessory:', device.deviceName);
      const accessory = new this.api.platformAccessory<AqaraPlatformAccessoryContext>(device.deviceName, uuid);
      accessory.context = {
        deviceInfo: device,
      };
      new AccessoryClass(this, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }

  private getAccessoryClass(deviceInfo: Aqara.DeviceInfo) {
    switch (deviceInfo.model) {
      case 'lumi.airer.acn001':
        return LumiAirerAcn001;
      case 'lumi.airer.acn02':
        return LumiAirerAcn02;
      case 'virtual.ir.tv':
        return VirtualIrTv;
      default:
        return undefined;
    }
  }
}
