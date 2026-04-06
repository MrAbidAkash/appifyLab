/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useCreateUserMutation } from "@/lib/services/userApi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const Register = () => {
  const router = useRouter();
  const [createUser] = useCreateUserMutation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" || type === "radio" ? checked : value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Example basic validations
    if (!formData.firstName || !formData.email || !formData.password) {
      toast.error("Please fill all required fields!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const response: any = await createUser(formData).unwrap();
      console.log("response", response);
      if (response?.status === 200) {
        toast.success(response?.message || "User created successfully");
        router.push("/");
      }
    } catch (error: any) {
      console.log("error", error);
      toast.error(error?.data?.message || "User creation failed");
    }
  };

  return (
    <section className="_social_registration_wrapper _layout_main_wrapper">
      <div className="_shape_one">
        <img src="/assets/images/shape1.svg" alt="" className="_shape_img" />
        <img
          src="/assets/images/dark_shape.svg"
          alt=""
          className="_dark_shape"
        />
      </div>

      <div className="_shape_two">
        <img src="/assets/images/shape2.svg" alt="" className="_shape_img" />
        <img
          src="/assets/images/dark_shape1.svg"
          alt=""
          className="_dark_shape _dark_shape_opacity"
        />
      </div>

      <div className="_shape_three">
        <img src="/assets/images/shape3.svg" alt="" className="_shape_img" />
        <img
          src="/assets/images/dark_shape2.svg"
          alt=""
          className="_dark_shape _dark_shape_opacity"
        />
      </div>

      <div className="_social_registration_wrap">
        <div className="container">
          <div className="row align-items-center">
            {/* LEFT IMAGES */}
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_registration_right">
                <div className="_social_registration_right_image">
                  <img src="/assets/images/registration.png" alt="Image" />
                </div>
                <div className="_social_registration_right_image_dark">
                  <img src="/assets/images/registration1.png" alt="Image" />
                </div>
              </div>
            </div>

            {/* RIGHT FORM */}
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_registration_content">
                <div className="_social_registration_right_logo _mar_b28">
                  <img
                    src="/assets/images/logo.svg"
                    alt="Image"
                    className="_right_logo"
                  />
                </div>

                <p className="_social_registration_content_para _mar_b8">
                  Get Started Now
                </p>

                <h4 className="_social_registration_content_title _titl4 _mar_b50">
                  Registration
                </h4>

                <button
                  type="button"
                  className="_social_registration_content_btn _mar_b40"
                >
                  <img
                    src="/assets/images/google.svg"
                    alt="Image"
                    className="_google_img"
                  />
                  <span>Register with google</span>
                </button>

                <div className="_social_registration_content_bottom_txt _mar_b40">
                  <span>Or</span>
                </div>

                {/* FORM */}
                <form
                  onSubmit={handleSubmit}
                  className="_social_registration_form"
                >
                  <div className="row">
                    <div className="col-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="form-control _social_registration_input"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="form-control _social_registration_input"
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="form-control _social_registration_input"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">
                          Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="form-control _social_registration_input"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">
                          Repeat Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="form-control _social_registration_input"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12">
                      <div className="form-check _social_registration_form_check">
                        <input
                          className="form-check-input _social_registration_form_check_input"
                          type="radio"
                          name="agree"
                          checked={formData.agree}
                          onChange={handleInputChange}
                        />
                        <label
                          className="form-check-label _social_registration_form_check_label"
                          htmlFor="agree"
                        >
                          I agree to terms & conditions
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12">
                      <div className="_social_registration_form_btn _mar_t40 _mar_b60">
                        <button
                          type="submit"
                          className="_social_registration_form_btn_link _reg_btn1"
                        >
                          Register now
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="row">
                  <div className="col-12">
                    <div className="_social_registration_bottom_txt">
                      <p className="_social_registration_bottom_txt_para">
                        Already have an account? <Link href="/">Login</Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* END FORM */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
