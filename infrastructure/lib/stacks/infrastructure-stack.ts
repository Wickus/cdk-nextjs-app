import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AssetBucketConstruct} from "../structs/asset-bucket.construct";
import {DeployBucketConstruct} from "../structs/deploy-bucket.construct";
import {CacheControl} from "aws-cdk-lib/aws-s3-deployment";
import {join} from "path";
import {ImageOptimizationConstruct} from "../structs/image-optimization.construct";
import {ServerConstruct} from "../structs/server.construct";
import {CloudfrontDistributionConstruct} from "../structs/cloudfront-distribution.construct";
import {HostedZoneConstruct} from "../structs/hosted-zone.construct";
import {CertificateConstruct} from "../structs/certificate.construct";

interface InfrastructureStackProps extends StackProps {
    CERTIFICATE_ARN: string,
    DOMAINS_NAMES: string[]
    DOMAIN: string,
    HOSTED_ZONE_ID: string
}

export class InfrastructureStack extends Stack {
    constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
        super(scope, id, props);
        /** This is the S3 bucket containing the assets of the website. */
        const assetsBucket = new AssetBucketConstruct(this, 'MyWebsiteAssetsBucket')
        /** This is the creation of the image optimization function for the next js images */
        const imageOptimizationFunction = new ImageOptimizationConstruct(this, 'MyWebsiteImageOptimizationFUnction', {
            bucket: assetsBucket.bucket
        })
        /** This is the creation of the server function that will handle all requests */
        const serverFunction = new ServerConstruct(this, 'MyWebsiteServerFunction')

        /** This creates a hosted zone for the website */
        const hostedZone = new HostedZoneConstruct(this, 'MyWebsiteHostedZone', {
            hostedZoneID: props.HOSTED_ZONE_ID,
            domain: props.DOMAIN
        })

        /** This construct crates a certificate for the distribution */
        const certificate = new CertificateConstruct(this, 'MyWebsiteCertificate', {
            domainNames: props.DOMAINS_NAMES,
            hostedZone: hostedZone.hostedZone,
            domain: props.DOMAIN
        })

        /** This is the creation of the distribution of the website */
        const cloudFlareDistribution = new CloudfrontDistributionConstruct(this, 'MyWebsiteDistribution', {
            bucket: assetsBucket.bucket,
            certificateArn: certificate.certificateArn,
            domainNames: props.DOMAINS_NAMES,
            imageFunctionUrl: imageOptimizationFunction.functionUrl,
            serverFunctionUrl: serverFunction.functionUrl
        })

        /** This is the deployment of the assets with a caching policy of ***immutable*** */
        new DeployBucketConstruct(this, 'DeployMyWebsiteImmutableAssets', {
            bucket: assetsBucket.bucket,
            cacheControl: [CacheControl.fromString('public,max-age=31536000,immutable')],
            assetsSource: join(__dirname, '../../../', '.open-next', 'assets'),
        })
        /** This is the deployment of the assets with a caching policy of ***must-revalidate*** */
        new DeployBucketConstruct(this, 'DeployMyWebsiteRevalidateAssets', {
            bucket: assetsBucket.bucket,
            cacheControl: [CacheControl.fromString('public,max-age=0,s-maxage=31536000,must-revalidate')],
            assetsSource: join(__dirname, '../../../', '.open-next', 'assets'),
            cloudFrontDistribution: cloudFlareDistribution.distribution
        })

        /* This part adds an 'A' records for the website */
        props.DOMAINS_NAMES.forEach((domainName, index) => {
            hostedZone.creatARecord(`${domainName}_ARecord_${index}`, domainName, cloudFlareDistribution.distribution)
        })
    }
}
