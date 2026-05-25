# Clan machines

Each subdirectory here is one clan machine. The flake auto-discovers them and
wires `self.nixosModules.default` + `./<name>/configuration.nix` into the
machine's NixOS config.

To add a new machine:

```bash
mkdir machines/<name>
$EDITOR machines/<name>/configuration.nix
```

A minimal configuration looks like:

```nix
{ config, ... }:
{
  networking.hostName = "<name>";
  system.stateVersion = "24.11";

  clan.core.networking.targetHost = "root@<ip-or-hostname>";

  services.saas-boilerplate = {
    enable = true;
    nginx = {
      enable = true;
      domain = "app.example.com";
      acmeEmail = "you@example.com";
    };
    # Point at a clan var / sops / agenix file holding BETTER_AUTH_SECRET etc.
    # environmentFile = config.clan.core.vars.generators.saas.files.env.path;
  };
}
```

Then from the repo root:

```bash
clan machines list
clan machines update <name>
```

See `./saas-example/` for a reference.
