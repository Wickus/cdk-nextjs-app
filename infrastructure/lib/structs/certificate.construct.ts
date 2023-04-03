import {Construct} from "constructs";
import {Certificate, CertificateValidation,} from "aws-cdk-lib/aws-certificatemanager";
import {IHostedZone} from "aws-cdk-lib/aws-route53";

class CertificateConstruct extends Construct {
    private readonly domainNames: string[]
    private readonly domain: string
    private readonly hostedZone: IHostedZone
    public certificateArn: string

    public constructor(scope: Construct, id: string, props: { domainNames: string[], domain: string, hostedZone: IHostedZone }) {
        super(scope, id);
        this.domainNames = props.domainNames
        this.hostedZone = props.hostedZone
        this.domain = props.domain
        this.certificateArn = this.createCertificate().certificateArn
    }

    private createCertificate = (): Certificate => {
        return new Certificate(this, 'WebsiteCertificate', {
            domainName: `*.${this.domain}`,
            validation: CertificateValidation.fromDns(this.hostedZone),
            subjectAlternativeNames: this.domainNames
        })
    }
}

export {CertificateConstruct}
