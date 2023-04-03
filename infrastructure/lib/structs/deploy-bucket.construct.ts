import {Construct} from "constructs";
import {BucketDeployment, CacheControl, Source} from "aws-cdk-lib/aws-s3-deployment";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Distribution} from "aws-cdk-lib/aws-cloudfront";

interface DeployBucketConstructProps {
    assetsSource: string
    bucket: Bucket
    cacheControl: CacheControl[]
    cloudFrontDistribution?: Distribution
}

class DeployBucketConstruct extends Construct {
    public readonly assetsSource: string
    public readonly cacheControl: CacheControl[]
    private readonly bucket: Bucket
    private readonly cloudFrontDistribution: Distribution | undefined

    public constructor(scope: Construct, id: string, props: DeployBucketConstructProps) {
        super(scope, id);
        this.assetsSource = props.assetsSource
        this.bucket = props.bucket
        this.cacheControl = props.cacheControl
        this.cloudFrontDistribution = props?.cloudFrontDistribution

        this.deployBucket()
    }

    private deployBucket = () => {
        return new BucketDeployment(this, 'BucketDeployment', {
            sources: [Source.asset(this.assetsSource)],
            destinationBucket: this.bucket,
            cacheControl: [...this.cacheControl],
            retainOnDelete: false,
            ...(this.cloudFrontDistribution ? {
                distribution: this.cloudFrontDistribution,
                distributionPaths: ['/*']
            } : {})
        })
    }
}

export {DeployBucketConstruct}
