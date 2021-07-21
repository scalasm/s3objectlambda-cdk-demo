# Anomyzing personal identifiable information with AWS S3 Access Poins and AWS Comprehend

This the CDK porting of the demo project present in the FooBar Serverless YouTube channel: the original used [AWS SAM](https://aws.amazon.com/serverless/sam/) 
while I wanted to use [AWS CDK](https://aws.amazon.com/cdk/) just for fun :) See the references section for more information.

Note that the lambda function is copy-and-pasted from https://github.com/mavi888/s3objectlambda-demo/ and so the author deserves all credits: I am only re-using it
as it is since my focus is making this work with CDK.

# How to run

Note that if you need some particular AWS profile, you can set the variable `AWS_PROFILE`. For example:
```
export AWS_PROFILE="development"

npm install 
```

## 1. Deploy the stack

```
npm run cdk:deploy
```

Take note of the following output, since you will need them when running the CLI commands:
```
Outputs:
S3ObjectlambdaCdkDemoStack.AnonymiserFunctionArn = arn:aws:lambda:eu-west-1:1234567890:function:S3ObjectlambdaCdkDemoStac-AnonymiserFunction292EC5-MoSGFaEwiEKf
S3ObjectlambdaCdkDemoStack.S3BucketName = s3objectlambdacdkdemostack-bucket-with-pii
S3ObjectlambdaCdkDemoStack.S3LambdaAccessPointArn = arn:aws:s3-object-lambda:eu-west-1:1234567890:accesspoint/bucket-with-pii-lambda-access-point
```

## 2. Copy the example file to your bucket 
```
aws s3 cp test-data/example.txt s3://<S3ObjectlambdaCdkDemoStack.S3BucketName>
```

## 3. Get the anonymised content

Now, if we try to access the same key `example.txt`, we will get an anonymised version of it:
```
aws s3api get-object --bucket <S3ObjectlambdaCdkDemoStack.S3LambdaAccessPointArn> --key example.txt ./anonymised.txt
```

```
mario@Sharkey:~/src/learning/s3objectlambda-cdk-demo$ cat anonymised.txt
Hello *****. Your AnyCompany Financial Services, LLC credit card account ***** has a minimum payment of $24.53 that is due by *****. Based on your autopay settings, we will withdraw your payment on the due date from your bank account ***** with the routing number *****. 

Your latest statement was mailed to *****. 
After your payment is received, you will receive a confirmation text message at *****. 
```

# References

* [MODIFY YOUR DATA ON THE FLY WITH S3 OBJECT LAMBDA - ANONYMIZE DATA WITH AMAZON COMPREHEND](https://www.youtube.com/watch?v=EDv9f9A-jck)