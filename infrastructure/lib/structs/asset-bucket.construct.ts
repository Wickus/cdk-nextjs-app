import {Construct} from "constructs";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {RemovalPolicy} from "aws-cdk-lib";

class AssetBucketConstruct extends Construct {
    public readonly bucketName: string;
    public readonly bucketArn: string;
    public readonly bucket: Bucket

    public constructor(scope: Construct, id: string) {
        super(scope, id);
        this.bucket = this.createBucket()
        this.bucketName = this.bucket.bucketName
        this.bucketArn = this.bucket.bucketArn
    }

    private createBucket = (): Bucket => {
        return new Bucket(this, 'AssetsBucket', {
            autoDeleteObjects: true,
            removalPolicy: RemovalPolicy.DESTROY,
        })
    }
}

export {AssetBucketConstruct}
