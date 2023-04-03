import {Construct} from "constructs";
import {
    AllowedMethods,
    BehaviorOptions,
    CacheCookieBehavior,
    CachedMethods,
    CacheHeaderBehavior,
    CachePolicy,
    CacheQueryStringBehavior,
    Distribution,
    ViewerProtocolPolicy
} from "aws-cdk-lib/aws-cloudfront";
import {HttpOrigin, OriginGroup, S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {FunctionUrl} from "aws-cdk-lib/aws-lambda";
import {Duration, Fn} from "aws-cdk-lib";
import {Certificate, ICertificate} from "aws-cdk-lib/aws-certificatemanager";
import {Bucket} from "aws-cdk-lib/aws-s3";

interface CloudfrontDistributionConstructProps {
    serverFunctionUrl: FunctionUrl,
    imageFunctionUrl: FunctionUrl,
    certificateArn: string;
    domainNames: string[],
    bucket: Bucket
}

class CloudfrontDistributionConstruct extends Construct {
    public readonly distribution: Distribution

    private readonly defaultBehavior: BehaviorOptions
    private readonly serverBehavior: BehaviorOptions
    private readonly bucketOrigin: S3Origin
    private readonly fallBackOriginGroup: OriginGroup
    private readonly cachePolicy: CachePolicy
    private readonly certificate: ICertificate
    private readonly imageBehavior: BehaviorOptions
    private readonly staticFileBehavior: BehaviorOptions

    private readonly serverFunctionUrl: FunctionUrl
    private readonly imageFunctionUrl: FunctionUrl
    private readonly certificateArn: string
    private readonly domainNames: string[]
    private readonly bucket: Bucket

    constructor(scope: Construct, id: string, props: CloudfrontDistributionConstructProps) {
        super(scope, id);
        this.serverFunctionUrl = props.serverFunctionUrl
        this.imageFunctionUrl = props.imageFunctionUrl
        this.certificateArn = props.certificateArn
        this.domainNames = props.domainNames
        this.bucket = props.bucket

        this.cachePolicy = this.createCachePolicy()
        this.bucketOrigin = this.createBucketOrigin()
        this.serverBehavior = this.createServerBehavior()
        this.fallBackOriginGroup = this.createOriginGroup()
        this.defaultBehavior = this.createDefaultBehavior()
        this.certificate = this.createCertificate()
        this.imageBehavior = this.createImageBehavior()
        this.staticFileBehavior = this.createStaticFileBehavior()
        this.distribution = this.createDistribution()
    }

    private createCachePolicy = (): CachePolicy => {
        return new CachePolicy(this, 'ServerCache', {
            queryStringBehavior: CacheQueryStringBehavior.all(),
            cookieBehavior: CacheCookieBehavior.all(),
            defaultTtl: Duration.days(0),
            maxTtl: Duration.days(365),
            minTtl: Duration.days(0),
            enableAcceptEncodingBrotli: true,
            enableAcceptEncodingGzip: true,
            comment: 'Server response cache policy.',
            headerBehavior: CacheHeaderBehavior.allowList(
                // required by image optimization request
                "accept",
                // required by server request
                "x-op-middleware-request-headers",
                "x-op-middleware-response-headers",
                "x-nextjs-data",
                "x-middleware-prefetch",
                // required by server request (in-place routing)
                "rsc",
                "next-router-prefetch",
                "next-router-state-tree"
            )
        })
    }

    private createBucketOrigin = (): S3Origin => {
        return new S3Origin(this.bucket)
    }

    private createServerBehavior = (): BehaviorOptions => {
        return {
            origin: new HttpOrigin(Fn.parseDomainName(this.serverFunctionUrl.url)),
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: AllowedMethods.ALLOW_ALL,
            cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
            compress: true,
            cachePolicy: this.cachePolicy
        }
    }
    private createOriginGroup = (): OriginGroup => {
        return new OriginGroup({
            primaryOrigin: this.serverBehavior.origin,
            fallbackOrigin: this.bucketOrigin,
            fallbackStatusCodes: [404]
        })
    }
    private createDefaultBehavior = (): BehaviorOptions => {
        return {
            origin: this.fallBackOriginGroup,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            compress: true,
            cachePolicy: this.serverBehavior.cachePolicy,
        }
    }
    private createCertificate = (): ICertificate => {
        return Certificate.fromCertificateArn(this, 'WebsiteCertificate', this.certificateArn)
    }

    private createImageBehavior = (): BehaviorOptions => {
        return {
            origin: new HttpOrigin(Fn.parseDomainName(this.imageFunctionUrl.url)),
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: AllowedMethods.ALLOW_ALL,
            cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
            compress: true,
            cachePolicy: this.cachePolicy
        }
    }

    private createStaticFileBehavior = (): BehaviorOptions => {
        return {
            origin: this.bucketOrigin,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
            compress: true,
            cachePolicy: CachePolicy.CACHING_OPTIMIZED
        }
    }

    private createDistribution = () => {
        return new Distribution(this, 'WebsiteDistribution', {
            defaultRootObject: '',
            defaultBehavior: this.defaultBehavior,
            certificate: this.certificate,
            domainNames: this.domainNames,
            additionalBehaviors: {
                'api/*': this.serverBehavior,
                '_next/data/*"': this.serverBehavior,
                '_next/image*"': this.imageBehavior,
                '_next/*"': this.staticFileBehavior,
            }
        })
    }
}

export {CloudfrontDistributionConstruct}
