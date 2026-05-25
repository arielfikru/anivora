{ config, lib, pkgs, ... }:
{
  networking.hostName = "saas-example";
  system.stateVersion = "24.11";

  nixpkgs.hostPlatform = lib.mkDefault "x86_64-linux";

  clan.core.networking.targetHost = lib.mkDefault "root@saas.example.com";

  boot.loader.grub.enable = lib.mkDefault true;
  boot.loader.grub.device = lib.mkDefault "/dev/vda";
  fileSystems."/" = lib.mkDefault {
    device = "/dev/vda1";
    fsType = "ext4";
  };

  services.openssh.enable = true;

  clan.core.vars.generators.saas-boilerplate = {
    files.env.secret = true;
    runtimeInputs = [ pkgs.openssl ];
    script = ''
      echo "BETTER_AUTH_SECRET=$(openssl rand -hex 32)" > "$out/env"
    '';
  };

  services.saas-boilerplate = {
    enable = true;
    environmentFile = config.clan.core.vars.generators.saas-boilerplate.files.env.path;
    nginx = {
      enable = true;
      domain = "app.example.com";
      enableSSL = true;
      acmeEmail = "you@example.com";
    };
  };
}
