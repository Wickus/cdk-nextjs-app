import {Construct} from "constructs";
import {Architecture, Code, Function as LambdaFunction, FunctionUrl, FunctionUrlAuthType, Runtime} from "aws-cdk-lib/aws-lambda"
import {join} from "path";
import {Duration, RemovalPolicy} from "aws-cdk-lib";
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";

class ImageOptimizationConstruct extends Construct {
    private readonly bucket: Bucket
    public readonly functionUrl: FunctionUrl

    constructor(scope: Construct, id: string, props: { bucket: Bucket }) {
        super(scope, id);
        this.bucket = props.bucket
        this.functionUrl = this.createImageOptimizationFunction().addFunctionUrl({
            authType: FunctionUrlAuthType.NONE
        })
    }

    private createImageOptimizationFunction = () => {
        return new LambdaFunction(this, 'ImageOptimisationFunction', {
            description: 'This is the image optimization function for handling Next.js images.',
            runtime: Runtime.NODEJS_18_X,
            code: Code.fromAsset(join(__dirname, '../../../', '.open-next', 'image-optimization-function')),
            handler: 'index.handler',
            currentVersionOptions: {
                removalPolicy: RemovalPolicy.DESTROY
            },
            logRetention: RetentionDays.THREE_DAYS,
            architecture: Architecture.ARM_64,
            timeout: Duration.seconds(15),
            memorySize: 512,
            environment: {
                BUCKET_NAME: this.bucket.bucketName
            },
            initialPolicy: [
                new PolicyStatement({
                    actions: ['s3:GetObject'],
                    resources: [this.bucket.arnForObjects('*')]
                })
            ]
        })
    }
}

export {ImageOptimizationConstruct}
