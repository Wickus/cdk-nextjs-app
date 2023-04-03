import {Construct} from "constructs";
import {ARecord, CnameRecord, HostedZone, IHostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {Distribution} from "aws-cdk-lib/aws-cloudfront";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";
import {Duration} from "aws-cdk-lib";

class HostedZoneConstruct extends Construct {
    public readonly hostedZone: IHostedZone
    private readonly hostedZoneID: string
    private readonly domain: string

    public constructor(scope: Construct, id: string, props: { hostedZoneID: string, domain: string }) {
        super(scope, id);
        this.hostedZoneID = props.hostedZoneID
        this.domain = props.domain
        this.hostedZone = this.createHostedZone()
    }

    private createHostedZone = (): IHostedZone => {
        return HostedZone.fromHostedZoneAttributes(this, 'WebsiteHostedZone', {
            hostedZoneId: this.hostedZoneID,
            zoneName: this.domain
        })
    }

    public creatARecord = (id: string, recordName: string, cloudFrontDistribution: Distribution): ARecord => {
        return new ARecord(this, id, {
            zone: this.hostedZone,
            recordName: recordName,
            target: RecordTarget.fromAlias(new CloudFrontTarget(cloudFrontDistribution)),
            comment: 'This will be the development alias',
            ttl: Duration.minutes(5)
        })
    }

    public createCnameRecord = (id: string, domainName: string): CnameRecord => {
        return new CnameRecord(this, id, {
            zone: this.hostedZone,
            recordName: domainName,
            domainName: domainName,
            comment: 'This will be the development root',
            deleteExisting: true,
            ttl: Duration.days(2)
        })
    }
}

export {HostedZoneConstruct}
