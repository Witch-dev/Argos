# Prints the .NET versions baked into a Microsoft (mcr.microsoft.com) image, for a tag or a digest.
# Usage: python -I mcr-image-version.py dotnet/aspnet sha256:<digest>   (or a tag like 10.0)
import json, sys, urllib.request
repo, ref = sys.argv[1], sys.argv[2]
A = "application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json"
def get(path, accept=A):
    r = urllib.request.Request(f"https://mcr.microsoft.com/v2/{repo}/{path}", headers={"Accept": accept})
    return json.load(urllib.request.urlopen(r))
idx = get(f"manifests/{ref}")
m = next(x for x in idx["manifests"] if x["platform"]["architecture"] == "amd64" and x["platform"]["os"] == "linux")
man = get(f"manifests/{m['digest']}")
cfg = get(f"blobs/{man['config']['digest']}", "*/*")
env = [e for e in cfg["config"]["Env"] if "VERSION" in e]
print(repo, ref[:19], env, cfg.get("created", "")[:10])
