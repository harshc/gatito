import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// Import the program's configuration settings.
const config = new pulumi.Config();
const gcpConfig = new pulumi.Config("gcp");
const region = gcpConfig.get("region") || "us-central1";
const zone = gcpConfig.get("zone") || "us-central1-a";

const machineType = config.get("machineType") || "f1-micro";
const osImage = config.get("osImage") || "debian-11";
const instanceTag = config.get("instanceTag") || "webserver";
const servicePort = config.get("servicePort") || "80";
const gpuType = config.get("gpuAcceleratorType") || "nvidia-tesla-t4";
const gpuCount = config.getNumber("gpuPerInstance") || 1;
const diskSize = config.getNumber("diskSize") || 50;
const sshKey = config.get("sshKey") || "harsh_chiplonkar";

// Create a new network for the virtual machine.
const network = new gcp.compute.Network("network", {
    autoCreateSubnetworks: false,
});

// Create a subnet on the network.
const subnet = new gcp.compute.Subnetwork("subnet", {
    ipCidrRange: "10.0.1.0/24",
    network: network.id,
});

// Create a firewall allowing inbound access over ports 80 (for HTTP) and 22 (for SSH).
const firewall = new gcp.compute.Firewall("firewall", {
    network: network.selfLink,
    allows: [
        {
            protocol: "tcp",
            ports: [
                "22",
                servicePort,
            ],
        },
    ],
    direction: "INGRESS",
    sourceRanges: [
        "0.0.0.0/0",
    ],
    targetTags: [
        instanceTag,
    ],
});

// Define a script to be run when the VM starts up.
const metadataStartupScript = `#!/bin/bash
    echo '<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Hello, world!</title>
    </head>
    <body>
        <h1>Hello, world! 👋</h1>
        <p>Deployed with 💜 by <a href="https://pulumi.com/">Pulumi</a>.</p>
    </body>
    </html>' > index.html
    sudo python3 -m http.server ${servicePort} &`;

// Create the virtual machine.
const instance = new gcp.compute.Instance("instance", {
    machineType: machineType,
    zone: zone,
    bootDisk: {
        initializeParams: {
            image: osImage,
            size: diskSize,
        },
    },
    networkInterfaces: [
        {
            network: network.id,
            subnetwork: subnet.id,
            accessConfigs: [
                {},
            ],
        },
    ],
    guestAccelerators: [{
        type: gpuType,
        count: gpuCount,

    }],
    serviceAccount: {
        scopes: [
            "https://www.googleapis.com/auth/cloud-platform",
        ],
    },
    scheduling: {
        onHostMaintenance: "TERMINATE",
        automaticRestart: false,
        // additional setting to ensure the instance can use the attached GPU
        preemptible: true,
    },
    allowStoppingForUpdate: true,
    metadataStartupScript,
    metadata: {
        "ssh-keys": sshKey,
    },
    tags: [
        instanceTag,
    ],
}, { dependsOn: firewall });

const instanceIP = instance.networkInterfaces.apply(interfaces => {
    return interfaces[0].accessConfigs![0].natIp;
});

// Export the instance's name, public IP address, and HTTP URL.
export const name = instance.name;
export const ip = instanceIP;
export const url = pulumi.interpolate`http://${instanceIP}:${servicePort}`;
