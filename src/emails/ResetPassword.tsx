import * as React from "react";
import { Text, Heading, Button } from "@react-email/components";
import Starter from "./Starter";

export type ResetPasswordProps = React.JSX.IntrinsicAttributes & {
  resetLink: string;
};

const ResetPassword: React.FC<ResetPasswordProps> = ({ resetLink }) => {
  return (
    <Starter previewText="Reset password for ammarahmed.ca">
      <Heading className="text-black text-[24px] text-center font-normal p-0 my-[30px] mx-0">
        <strong>Reset password</strong>
      </Heading>
      <Text className="text-black text-[16px] font-normal p-0 mx-0">
        After you click the button below, you'll be asked to complete the
        following steps:
      </Text>
      <Text className="text-black text-[16px] font-normal p-0 mx-0">
        <ol style={{ lineHeight: "30px" }}>
          <li>Enter a new password</li>
          <li>Confirm your new password</li>
          <li>Click reset</li>
        </ol>
      </Text>
      <Button
        className="w-full text-center text-[24px] bg-black rounded text-white py-2"
        href={resetLink}
      >
        Reset your password
      </Button>
      <Text className="text-black text-[16px] font-normal text-center p-0 mx-0">
        This link is valid for <strong>one use only</strong>. Expires in{" "}
        <strong>10 minutes</strong>.
      </Text>
      <Text className="text-black text-[12px] font-light text-center p-0 mx-0">
        If you did not reset your password at ammarahmed.ca, you can safely
        disregard this message or contact me at ammar.ahmed2203@gmail.com.
      </Text>
    </Starter>
  );
};

export default ResetPassword;
