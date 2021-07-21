import * as cdk from '@aws-cdk/core';

import * as s3 from "@aws-cdk/aws-s3";
import * as s3objectlambda from "@aws-cdk/aws-s3objectlambda";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";

export class DemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The bucket hosting the documents with personal identifiable information
    const bucketWithPii = new s3.Bucket(this, "S3BucketWithPii", {
      bucketName: `${this.stackName.toLowerCase()}-bucket-with-pii`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const bucketAccessPoint = new s3.CfnAccessPoint(this, "S3BucketAccessPoint", {
      name: "bucket-with-pii-lambda-access-point",
      bucket: bucketWithPii.bucketName
    });

    // Anonymiser Lambda function w/ permissions
    const anonymiserFunction = new lambda.Function(this, "AnonymiserFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      memorySize: 1024,
    });

    anonymiserFunction.addToRolePolicy(new iam.PolicyStatement({
      sid: "WriteS3GetObjectResponse",
      effect: iam.Effect.ALLOW,
      actions: [
        "s3-object-lambda:WriteGetObjectResponse"
      ],
      resources: ["*"]
    }));
    anonymiserFunction.addToRolePolicy(new iam.PolicyStatement({
      sid: "UseComprehend",
      effect: iam.Effect.ALLOW,
      actions: [
        "comprehend:DetectPiiEntities"
      ],
      resources: ["*"]
    }));

    // With this access point, we create a "virtual S3 bucket": every time a key is accessed using this ARN, then
    // 'anonymiserFunction' is invoked, which in turn 
    const lambdaAccessPoint = new s3objectlambda.CfnAccessPoint(this, "S3LambdaAccessPoint", {
      name: "bucket-with-pii-lambda-access-point",
      objectLambdaConfiguration: {
        supportingAccessPoint: `arn:${this.partition}:s3:${this.region}:${this.account}:accesspoint/${bucketAccessPoint.name}`,
        transformationConfigurations: [{
          actions: ["GetObject"],
          contentTransformation: {
            AwsLambda: {
              FunctionArn: anonymiserFunction.functionArn
            }
          }
        }
        ]
      }
    });

    // Output vars 
    new cdk.CfnOutput(this, "S3BucketName", {
      value: bucketWithPii.bucketName || ''
    });
    new cdk.CfnOutput(this, "AnonymiserFunctionArn", {
      value: anonymiserFunction.functionArn || ''
    });
    new cdk.CfnOutput(this, "S3LambdaAccessPointArn", {
      value: lambdaAccessPoint.attrArn || ''
    });
  }
}
