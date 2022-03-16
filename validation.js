function Validation(options) {
    const getParent = (element, selector) => {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    };

    const selectorRules = {};

    //Lấy elements của form cần validate
    const formElement = document.querySelector(options.form);

    const validate = (inputElement, rule) => {
        let errorElement = getParent(
            inputElement,
            options.formGroupSelector
        ).querySelector(options.error);
        let errorMessage;
        //Lấy ra các rules của selector
        const rules = selectorRules[rule.selector];

        //Lọc qua từng rule & kiểm tra
        //Nếu có lỗi thì dừng kiểm tra
        for (let i = 0; i < rules.length; ++i) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }

            if (errorMessage) {
                break;
            }
        }

        if (errorMessage) {
            errorElement.innerHTML = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add(
                'invalid'
            );
        } else {
            errorElement.innerHTML = '';
            getParent(inputElement, options.formGroupSelector).classList.remove(
                'invalid'
            );
        }

        return !errorMessage;
    };

    if (formElement) {
        //Khi submit form
        formElement.onsubmit = (e) => {
            e.preventDefault();

            let isFormValid = true;

            //lặp qua từng rule và validate
            options.rules.forEach((rule) => {
                const inputElement = formElement.querySelector(rule.selector);

                let isValid = validate(inputElement, rule);

                if (!isValid) {
                    isFormValid = false;
                }
            });

            if (isFormValid) {
                //Trường hợp submit với Javascript
                if (typeof options.onSubmit === 'function') {
                    const enabledInput = formElement.querySelectorAll('[name]');

                    const formValues = Array.from(enabledInput).reduce(
                        (values, input) => {
                            switch (input.type) {
                                case 'radio':
                                    values[input.name] =
                                        formElement.querySelector(
                                            `input[name= "${input.name}"]:checked`
                                        ).value;
                                    break;
                                case 'checkbox':
                                    if (!input.matches(':checked')) {
                                        //BUG CHECKBOX
                                        // values[input.name] = '';
                                        return values;
                                    }

                                    if (!Array.isArray(values[input.name])) {
                                        values[input.name] = [];
                                    }
                                    values[input.name].push(input.value);
                                    break;
                                // case 'file':
                                //     values[input.name] = input.files;
                                //     break;
                                default:
                                    values[input.name] = input.value;
                            }

                            return values;
                        },
                        {}
                    );

                    options.onSubmit(formValues);
                } else {
                    //Trường hợp ko submit với Javascript

                    formElement.submit();
                }
            }
        };

        //Lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur, input, ...)
        options.rules.forEach((rule) => {
            //Lưu lại các rules cho mỗi input
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            const inputElements = formElement.querySelectorAll(rule.selector);

            Array.from(inputElements).forEach((inputElement) => {
                //Xử lý khi người dùng blur
                inputElement.onblur = () => {
                    validate(inputElement, rule);
                };

                //Xử lý khi người dùng nhập
                inputElement.oninput = () => {
                    let errorElement = getParent(
                        inputElement,
                        options.formGroupSelector
                    ).querySelector(options.error);

                    errorElement.innerHTML = '';

                    getParent(
                        inputElement,
                        options.formGroupSelector
                    ).classList.remove('invalid');
                };
            });
        });
    }
}

//RULES

Validation.isRequired = function (selector, message) {
    return {
        selector: selector,
        test: (value) => {
            return value ? undefined : message || 'Vui lòng nhập trường này';
        },
    };
};

Validation.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: (value) => {
            const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

            return regex.test(value)
                ? undefined
                : message || 'Vui lòng nhập email';
        },
    };
};

Validation.minLength = function (selector, min, message) {
    return {
        selector: selector,
        test: (value) => {
            return value.length >= min
                ? undefined
                : message || `Vui lòng nhập tối thiểu ${min} ký tự`;
        },
    };
};

Validation.isComfirmed = (selector, getComfirmValue, message) => {
    return {
        selector: selector,
        test: (value) => {
            return value === getComfirmValue()
                ? undefined
                : message || 'Giá trị nhập vào không chính xác';
        },
    };
};
