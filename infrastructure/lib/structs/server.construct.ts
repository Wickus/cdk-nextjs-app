import {Construct} from "constructs";
import {Architecture, Code, Function as LambdaFunction, FunctionUrl, FunctionUrlAuthType, Runtime} from "aws-cdk-lib/aws-lambda"
import {join} from "path";
import {Duration} from "aws-cdk-lib";
import {RetentionDays} from "aws-cdk-lib/aws-logs";

class ServerConstruct extends Construct {
    public readonly functionUrl: FunctionUrl

    public constructor(scope: Construct, id: string) {
        super(scope, id);
        this.functionUrl = this.createServerFunction().addFunctionUrl({
            authType: FunctionUrlAuthType.NONE
        })
    }

    private createServerFunction = () => {
        return new LambdaFunction(this, 'ServerFunction', {
            description: 'This is the server function for the Next.js website',
            runtime: Runtime.NODEJS_18_X,
            code: Code.fromAsset(join(__dirname, '../../../', '.open-next', 'server-function')),
            handler: 'index.handler',
            architecture: Architecture.ARM_64,
            memorySize: 512,
            timeout: Duration.seconds(10),
            logRetention: RetentionDays.THREE_DAYS
        })
    }
}

export {ServerConstruct}
